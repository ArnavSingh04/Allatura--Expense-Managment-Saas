'use strict';
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const net = require('node:net');
const cp = require('node:child_process');
const guard = require('./node-guard.cjs');
const reportDir = process.env.PLUTUS_QA_REPORT_DIR;
const violations = [];
const tunnelSockets = new Set();
const report = { layer: 'mocked-browser', realBackend: false, nodeGuard: process.plutusQaGuard === true, children: [], cleanup: false };
const listen = (server) => new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', () => resolve(server.address().port)); });
const closeServer = (server) => new Promise((resolve, reject) => { if (!server?.listening) return resolve(); server.closeAllConnections?.(); server.close((error) => error ? reject(error) : resolve()); });
let serverChild, browserChild, serverExit, browserExit, proxy, rejectedBackend;
const finished = (child) => new Promise((resolve) => { child.once('error', (error) => resolve({ code: 2, error: error.message })); child.once('close', (code, signal) => resolve({ code: code === 0 && !signal ? 0 : code || 2, signal })); });
function terminateOwnedTree(child) {
  if (child?.pid && child.exitCode === null && child.signalCode === null) {
    const result = cp.spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, encoding: 'utf8' });
    if (result.status !== 0 && child.exitCode === null) throw new Error('Owned child tree termination failed');
  }
}
async function stopOwned(child, exit, graceful) {
  if (!child || !exit) return;
  if (child.exitCode !== null || child.signalCode !== null) return exit;
  if (graceful && child.connected) child.send('qa-close');
  else terminateOwnedTree(child);
  let timer;
  const deadline = new Promise((_resolve, reject) => { timer = setTimeout(() => { try { terminateOwnedTree(child); } catch (error) { reject(error); } }, 15000); });
  try { return await Promise.race([exit, deadline]); } finally { clearTimeout(timer); }
}

(async () => {
  try {
    if (!process.plutusQaGuard) throw new Error('Browser coordinator guard missing');
    const reservation = net.createServer();
    const frontendPort = await listen(reservation);
    await closeServer(reservation);
    guard.registerOwnedPort(frontendPort);
    const origin = `http://127.0.0.1:${frontendPort}`;
    rejectedBackend = http.createServer((request, response) => { violations.push(`Unexpected server API forwarding: ${request.method} ${request.url?.split('?')[0]}`); response.writeHead(599); response.end('No real backend is configured for this layer'); });
    const backendPort = await listen(rejectedBackend);
    proxy = http.createServer((request, response) => {
      let target;
      try { target = new URL(request.url); } catch { response.writeHead(400); response.end(); return; }
      if (target.origin !== origin) { violations.push(`Native proxy denied: ${target.origin}${target.pathname}`); response.writeHead(403); response.end(); return; }
      const upstream = http.request(target, { method: request.method, headers: request.headers }, (result) => { response.writeHead(result.statusCode, result.headers); result.pipe(response); });
      upstream.on('error', () => { response.writeHead(502); response.end(); });
      request.pipe(upstream);
    });
    proxy.on('connect', (request, socket, head) => {
      if (request.url !== `127.0.0.1:${frontendPort}`) { violations.push(`Native proxy denied CONNECT: ${request.url}`); socket.end('HTTP/1.1 403 Forbidden\r\n\r\n'); return; }
      const upstream = net.connect({ host: '127.0.0.1', port: frontendPort });
      tunnelSockets.add(socket); tunnelSockets.add(upstream);
      socket.once('close', () => { tunnelSockets.delete(socket); upstream.destroy(); });
      upstream.once('close', () => { tunnelSockets.delete(upstream); socket.destroy(); });
      upstream.on('error', () => socket.destroy()); socket.on('error', () => upstream.destroy());
      upstream.once('connect', () => { socket.write('HTTP/1.1 200 Connection Established\r\n\r\n'); if (head.length) upstream.write(head); upstream.pipe(socket); socket.pipe(upstream); });
    });
    proxy.on('upgrade', (request, socket, head) => {
      let target;
      try { target = new URL(request.url, origin); } catch { socket.destroy(); return; }
      if (!['http:', 'ws:'].includes(target.protocol) || target.host !== `127.0.0.1:${frontendPort}` || request.headers.host !== target.host || target.pathname !== '/_next/webpack-hmr') { violations.push(`Native proxy denied Upgrade: ${target.origin}${target.pathname}`); socket.end('HTTP/1.1 403 Forbidden\r\n\r\n'); return; }
      const upstream = net.connect({ host: '127.0.0.1', port: frontendPort });
      tunnelSockets.add(socket); tunnelSockets.add(upstream);
      socket.once('close', () => { tunnelSockets.delete(socket); upstream.destroy(); }); upstream.once('close', () => { tunnelSockets.delete(upstream); socket.destroy(); });
      socket.on('error', () => upstream.destroy()); upstream.on('error', () => socket.destroy());
      upstream.once('connect', () => {
        const headers = Object.entries(request.headers).map(([name, value]) => `${name}: ${Array.isArray(value) ? value.join(', ') : value}`).join('\r\n');
        upstream.write(`${request.method} ${target.pathname}${target.search} HTTP/1.1\r\n${headers}\r\n\r\n`);
        if (head.length) upstream.write(head); upstream.pipe(socket); socket.pipe(upstream);
      });
    });
    const proxyPort = await listen(proxy);
    const env = { ...process.env, PLUTUS_QA_PORTS: JSON.stringify([frontendPort, backendPort, proxyPort]), PLUTUS_QA_FRONTEND_PORT: String(frontendPort), APP_BASE_URL: origin, NEXT_PUBLIC_APP_URL: origin, NEXT_PUBLIC_BACKEND_API_URL: '/api/v1', BACKEND_API_URL: `http://127.0.0.1:${backendPort}/v1`, INTERNAL_BACKEND_URL: `http://127.0.0.1:${backendPort}/v1`, PLUTUS_QA_BASE_URL: origin, PLUTUS_QA_BROWSER_PROXY: `http://127.0.0.1:${proxyPort}` };
    const serverCommand = [path.join(process.cwd(), 'qa/harness/next-server.cjs')];
    serverChild = cp.spawn(process.execPath, serverCommand, { cwd: process.cwd(), env: { ...env, NODE_ENV: 'development' }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'], windowsHide: true });
    report.children.push({ kind: 'Next development server', pid: serverChild.pid, command: [process.execPath, ...serverCommand] });
    serverExit = finished(serverChild);
    serverChild.stdout.on('data', (data) => fs.appendFileSync(path.join(reportDir, 'next-stdout.log'), data));
    serverChild.stderr.on('data', (data) => fs.appendFileSync(path.join(reportDir, 'next-stderr.log'), data));
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Owned Next server readiness deadline exceeded')), 120000);
      serverChild.once('message', (message) => { clearTimeout(timer); if (message?.type === 'qa-ready' && message.port === frontendPort) resolve(); else reject(new Error('Unexpected Next readiness message')); });
      serverChild.once('exit', (code) => { clearTimeout(timer); reject(new Error(`Owned Next server exited before readiness: ${code}`)); });
      serverChild.once('error', (error) => { clearTimeout(timer); reject(error); });
    });
    const health = await fetch(`${origin}/__qa/ready`);
    report.readiness = await health.json();
    if (health.status !== 200 || !report.readiness.ready || !report.readiness.guard) throw new Error('Owned Next readiness proof failed');
    const command = [path.join(process.env.PLUTUS_QA_DEPENDENCIES, 'node_modules/@playwright/test/cli.js'), 'test', '--config', 'playwright.qa.config.ts'];
    if (process.env.PLUTUS_QA_BROWSER_PROJECT) command.push('--project', process.env.PLUTUS_QA_BROWSER_PROJECT);
    if (process.env.PLUTUS_QA_MAX_FAILURES === '1') command.push('--max-failures', '1');
    report.command = [process.execPath, ...command];
    browserChild = cp.spawn(process.execPath, command, { cwd: process.cwd(), env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    browserExit = finished(browserChild);
    report.children.push({ kind: 'Playwright test runner', pid: browserChild.pid, command: report.command });
    browserChild.stdout.on('data', (data) => process.stdout.write(data)); browserChild.stderr.on('data', (data) => process.stderr.write(data));
    const browserResult = await browserExit;
    report.browserExitCode = browserResult.code; report.browserSignal = browserResult.signal; if (browserResult.error) report.browserError = browserResult.error;
    process.exitCode = report.browserExitCode || 0;
  } catch (error) { report.error = error.message; console.error(error); process.exitCode = 2; }
  finally {
    const cleanup = await Promise.allSettled([stopOwned(browserChild, browserExit, false), stopOwned(serverChild, serverExit, true)]);
    const serverResult = cleanup[1].status === 'fulfilled' ? cleanup[1].value : null;
    report.serverExitCode = serverResult?.code ?? null;
    report.serverSignal = serverResult?.signal ?? null;
    for (const socket of tunnelSockets) socket.destroy();
    const closeResults = await Promise.allSettled([closeServer(proxy), closeServer(rejectedBackend)]);
    report.cleanupErrors = [...cleanup, ...closeResults].filter((result) => result.status === 'rejected').map((result) => result.reason.message);
    report.cleanup = report.cleanupErrors.length === 0; report.violations = violations;
    process.exitCode = process.exitCode || report.serverExitCode || (violations.length || !report.cleanup ? 1 : 0);
    fs.writeFileSync(path.join(reportDir, 'browser-execution.json'), JSON.stringify(report, null, 2) + '\n');
  }
})();
