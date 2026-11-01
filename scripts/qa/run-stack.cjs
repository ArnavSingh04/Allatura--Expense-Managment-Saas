'use strict';
// Dedicated integration coordinator: real Next proxy -> Nest -> disposable Mongo.
// Identity issuance is synthetic; no external Auth0 login or provider is contacted.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const http = require('node:http');
const net = require('node:net');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../..');
const backendRoot = fs.existsSync(path.join(root, '.qa-system-backend/scripts/qa/run-isolated.cjs'))
  ? path.join(root, '.qa-system-backend') : path.resolve(root, '../plutus-be');
const dependencies = path.join(root, '.qa-agent-work/frontend-phase-2026-11-01/dependencies');
const runId = `stack-${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`;
const reportDir = path.join(root, 'qa-raw/playwright-results', runId);
fs.mkdirSync(reportDir, { recursive: true });
const report = { runId, layer: 'stack', boundary: 'Real frontend/Nest/Mongo; locally issued JWT and encrypted SDK session; no external Auth0 login', status: 'RUNNING', exitCode: 2, cleanup: false };
const nonce = crypto.randomUUID();
let stage, bridge, proxy;
const children = []; const sockets = new Set(); const violations = [];
const listen = (server) => new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', () => resolve(server.address().port)); });
const delay = (ms) => new Promise((resolve) => { const timer = setTimeout(resolve, ms); timer.unref(); });
const minimalEnv = () => Object.fromEntries(['SystemRoot', 'WINDIR', 'ComSpec', 'PATHEXT', 'PATH', 'OS', 'PROCESSOR_ARCHITECTURE', 'NUMBER_OF_PROCESSORS'].filter((key) => process.env[key]).map((key) => [key, process.env[key]]));
function child(script, args, cwd, env, label, ipc = false) {
  const processHandle = cp.spawn(process.execPath, [script, ...args], { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe', ...(ipc ? ['ipc'] : [])] });
  const entry = { process: processHandle, label, closed: false };
  entry.done = new Promise((resolve) => { processHandle.once('error', (error) => resolve({ code: 2, error: error.message })); processHandle.once('close', (code, signal) => { entry.closed = true; resolve({ code: code === 0 && !signal ? 0 : code || 2, signal }); }); });
  processHandle.stdout.on('data', (data) => fs.appendFileSync(path.join(reportDir, `${label}-stdout.log`), data));
  processHandle.stderr.on('data', (data) => fs.appendFileSync(path.join(reportDir, `${label}-stderr.log`), data));
  children.push(entry); return entry;
}
async function stop(entry) {
  if (entry.closed) return entry.done;
  if (entry.process.connected) entry.process.send('qa-close');
  const finished = await Promise.race([entry.done, delay(15000).then(() => null)]);
  if (finished) return finished;
  if (entry.process.pid && !entry.closed) cp.spawnSync('taskkill', ['/pid', String(entry.process.pid), '/T', '/F'], { windowsHide: true, encoding: 'utf8' });
  return entry.done;
}
(async () => {
  try {
    stage = fs.mkdtempSync(path.join(os.tmpdir(), 'plutus-fe-qa-'));
    fs.writeFileSync(path.join(stage, '.qa-owned.json'), JSON.stringify({ nonce }));
    const scopes = ['src', 'public', 'tests', 'qa/harness', 'package.json', 'package-lock.json', 'tsconfig.json', 'next.config.js', 'postcss.config.js', 'tailwind.config.ts', 'tailwind.config.js', 'playwright.stack.config.ts'];
    const files = new Set();
    for (const flags of [['ls-files', '-z'], ['ls-files', '--others', '--exclude-standard', '-z']]) {
      for (const file of cp.execFileSync('git', ['-C', root, ...flags, '--', ...scopes], { encoding: 'utf8' }).split('\0')) if (file) files.add(file);
    }
    const manifest = [];
    for (const file of [...files].sort()) {
      if (['.DS_Store', '.gitkeep'].includes(path.basename(file))) continue;
      if (!/\.(tsx?|jsx?|cjs|mjs|mts|json|css|svg|png|jpe?g|webp|ico|woff2?|ttf|md)$/i.test(file) || /^\.env|credential|private[-_.]?key|service[-_.]?account/i.test(path.basename(file))) throw new Error('Unexpected staging candidate');
      const from = path.resolve(root, file); const to = path.resolve(stage, file);
      if (!from.startsWith(root + path.sep) || !to.startsWith(stage + path.sep) || !fs.lstatSync(from).isFile()) throw new Error('Staging path outside owned source');
      fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to);
      manifest.push({ path: file, sha256: crypto.createHash('sha256').update(fs.readFileSync(from)).digest('hex') });
    }
    fs.writeFileSync(path.join(reportDir, 'source-manifest.json'), JSON.stringify(manifest, null, 2));
    fs.writeFileSync(path.join(stage, 'next-env.d.ts'), '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n');
    fs.symlinkSync(path.join(dependencies, 'node_modules'), path.join(stage, 'node_modules'), 'junction');
    const bridgeDir = path.join(stage, 'bridge'); fs.mkdirSync(bridgeDir);
    const bridgeChild = child(path.join(backendRoot, 'scripts/qa/run-isolated.cjs'), ['--layer', 'stack-bridge', '--bridge-dir', bridgeDir], backendRoot, { ...minimalEnv(), CI: '1', TZ: 'UTC' }, 'backend');
    const bridgeFile = path.join(bridgeDir, 'bridge.json');
    for (let i = 0; !fs.existsSync(bridgeFile) && i < 1200; i++) { if (bridgeChild.closed) throw new Error('Backend bridge exited before readiness'); await delay(100); }
    if (!fs.existsSync(bridgeFile)) throw new Error('Backend bridge readiness timeout');
    bridge = JSON.parse(fs.readFileSync(bridgeFile, 'utf8'));
    for (const url of [bridge.backendUrl, bridge.controlUrl]) { if (new URL(url).hostname !== '127.0.0.1' || new URL(url).protocol !== 'http:') throw new Error('Bridge must be task-owned loopback'); }
    const reservation = net.createServer(); const frontendPort = await listen(reservation); await new Promise((resolve) => reservation.close(resolve));
    const origin = `http://127.0.0.1:${frontendPort}`;
    proxy = http.createServer((request, response) => {
      let target; try { target = new URL(request.url); } catch { response.writeHead(400); response.end(); return; }
      if (target.origin !== origin) { violations.push(`Denied origin ${target.origin}`); response.writeHead(403); response.end(); return; }
      const upstream = http.request(target, { method: request.method, headers: request.headers }, (result) => { response.writeHead(result.statusCode, result.headers); result.pipe(response); });
      upstream.on('error', () => { response.writeHead(502); response.end(); }); request.pipe(upstream);
    });
    proxy.on('connect', (request, socket, head) => {
      if (request.url !== `127.0.0.1:${frontendPort}`) { violations.push('Denied CONNECT'); socket.end('HTTP/1.1 403 Forbidden\r\n\r\n'); return; }
      const upstream = net.connect({ host: '127.0.0.1', port: frontendPort });
      sockets.add(socket); sockets.add(upstream);
      socket.on('error', () => upstream.destroy()); upstream.on('error', () => socket.destroy());
      socket.once('close', () => { sockets.delete(socket); upstream.destroy(); }); upstream.once('close', () => { sockets.delete(upstream); socket.destroy(); });
      upstream.once('connect', () => { socket.write('HTTP/1.1 200 Connection Established\r\n\r\n'); if (head.length) upstream.write(head); upstream.pipe(socket); socket.pipe(upstream); });
    });
    proxy.on('upgrade', (request, socket, head) => {
      let target;
      try { target = new URL(request.url, origin); } catch { socket.destroy(); return; }
      if (!['http:', 'ws:'].includes(target.protocol) || target.host !== `127.0.0.1:${frontendPort}` || request.headers.host !== target.host || target.pathname !== '/_next/webpack-hmr') {
        violations.push('Denied WebSocket upgrade'); socket.end('HTTP/1.1 403 Forbidden\r\n\r\n'); return;
      }
      const upstream = net.connect({ host: '127.0.0.1', port: frontendPort });
      sockets.add(socket); sockets.add(upstream);
      socket.once('close', () => { sockets.delete(socket); upstream.destroy(); }); upstream.once('close', () => { sockets.delete(upstream); socket.destroy(); });
      socket.on('error', () => upstream.destroy()); upstream.on('error', () => socket.destroy());
      upstream.once('connect', () => {
        const headers = Object.entries(request.headers).map(([name, value]) => `${name}: ${Array.isArray(value) ? value.join(', ') : value}`).join('\r\n');
        upstream.write(`${request.method} ${target.pathname}${target.search} HTTP/1.1\r\n${headers}\r\n\r\n`);
        if (head.length) upstream.write(head); upstream.pipe(socket); socket.pipe(upstream);
      });
    });
    const proxyPort = await listen(proxy);
    const { encrypt } = await import(pathToFileURL(path.join(dependencies, 'node_modules/@auth0/nextjs-auth0/dist/server/cookies.js')).href);
    const now = Math.floor(Date.now() / 1000);
    for (const [name, actor] of Object.entries(bridge.actors)) {
      actor.cookie = await encrypt({ user: { sub: actor.sub, email: actor.email, name: `QA ${name}` },
        tokenSet: { accessToken: actor.accessToken, expiresAt: now + 3600, audience: bridge.auth0.audience, scope: 'openid profile email' },
        internal: { sid: `qa-${name}`, createdAt: now } }, bridge.auth0.secret, now + 3600);
    }
    fs.writeFileSync(path.join(stage, 'qa-stack.json'), JSON.stringify(bridge));
    fs.mkdirSync(path.join(stage, 'tmp'));
    const env = { ...minimalEnv(), TEMP: path.join(stage, 'tmp'), TMP: path.join(stage, 'tmp'), TMPDIR: path.join(stage, 'tmp'), CI: '1', TZ: 'UTC', NEXT_TELEMETRY_DISABLED: '1', NODE_ENV: 'development',
      NODE_OPTIONS: `--require="${path.join(stage, 'qa/harness/node-guard.cjs').split(path.sep).join('/')}"`,
      PLUTUS_QA_STAGE_ROOT: stage, PLUTUS_QA_DEPENDENCIES: dependencies, PLUTUS_QA_REPORT_DIR: reportDir, PLUTUS_QA_LAYER: 'stack',
      PLUTUS_QA_PORTS: JSON.stringify([frontendPort, proxyPort, Number(new URL(bridge.backendUrl).port), Number(new URL(bridge.controlUrl).port)]),
      PLUTUS_QA_FRONTEND_PORT: String(frontendPort), PLUTUS_QA_BASE_URL: origin, PLUTUS_QA_BROWSER_PROXY: `http://127.0.0.1:${proxyPort}`,
      PLUTUS_QA_BROWSER_OUTPUT: path.join(reportDir, 'artifacts'), PLUTUS_QA_BROWSER_JSON: path.join(reportDir, 'playwright.json'),
      PLAYWRIGHT_BROWSERS_PATH: path.join(root, '.qa-agent-work/frontend-phase-2026-11-01/browsers'),
      NEXT_FONT_GOOGLE_MOCKED_RESPONSES: path.join(stage, 'qa/harness/font-responses.cjs'),
      AUTH0_DOMAIN: 'qa.invalid', AUTH0_CLIENT_ID: 'qa-synthetic-client', AUTH0_CLIENT_SECRET: 'qa-synthetic-secret', AUTH0_SECRET: bridge.auth0.secret, AUTH0_AUDIENCE: bridge.auth0.audience,
      APP_BASE_URL: origin, NEXT_PUBLIC_APP_URL: origin, NEXT_PUBLIC_BACKEND_API_URL: '/api/v1', BACKEND_API_URL: bridge.backendUrl, INTERNAL_BACKEND_URL: bridge.backendUrl,
    };
    const frontend = child(path.join(stage, 'qa/harness/next-server.cjs'), [], stage, env, 'frontend', true);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Next readiness timeout')), 120000);
      frontend.process.once('message', (message) => { clearTimeout(timer); message?.type === 'qa-ready' ? resolve() : reject(new Error('Unexpected readiness')); });
      frontend.process.once('exit', () => { clearTimeout(timer); reject(new Error('Next exited before readiness')); });
    });
    const runner = child(path.join(dependencies, 'node_modules/@playwright/test/cli.js'), ['test', '--config', 'playwright.stack.config.ts'], stage, env, 'playwright');
    const result = await Promise.race([runner.done, delay(600000).then(() => { throw new Error('Stack browser deadline exceeded'); })]);
    report.exitCode = result.code; report.status = result.code === 0 ? 'PASS' : 'FAIL';
    if (fs.existsSync(path.join(reportDir, 'playwright.json'))) report.stats = JSON.parse(fs.readFileSync(path.join(reportDir, 'playwright.json'), 'utf8')).stats;
  } catch (error) { report.error = error.message; report.status = 'FAIL'; report.exitCode = 2; }
  finally {
    const cleanupErrors = [];
    if (bridge) { try { const result = await fetch(`${bridge.controlUrl}/shutdown`, { method: 'POST', headers: { 'x-qa-control': bridge.controlToken }, signal: AbortSignal.timeout(15000) }); if (!result.ok) throw new Error('Bridge shutdown rejected'); } catch (error) { cleanupErrors.push(error.message); } }
    for (const entry of [...children].reverse()) { try {
      const result = await stop(entry); entry.exitCode = result.code;
      // A recorded assertion/worker failure is a test failure, not a failure to
      // stop a process that has already exited. Service teardown remains gated.
      if (entry.label !== 'playwright' && result.code !== 0) cleanupErrors.push(`${entry.label} exit ${result.code}`);
    } catch (error) { cleanupErrors.push(error.message); } }
    for (const socket of sockets) socket.destroy();
    if (proxy) { proxy.closeAllConnections?.(); await new Promise((resolve) => proxy.close(resolve)); }
    if (stage) { try {
      const resolved = fs.realpathSync(stage); const temp = fs.realpathSync(os.tmpdir());
      if (path.dirname(resolved).toLowerCase() !== temp.toLowerCase() || !path.basename(resolved).startsWith('plutus-fe-qa-') || JSON.parse(fs.readFileSync(path.join(resolved, '.qa-owned.json'), 'utf8')).nonce !== nonce) throw new Error('Stage cleanup ownership mismatch');
      const junction = path.join(resolved, 'node_modules'); if (fs.existsSync(junction)) { if (!fs.lstatSync(junction).isSymbolicLink()) throw new Error('Unexpected dependency target'); fs.unlinkSync(junction); }
      fs.rmSync(resolved, { recursive: true }); report.stageRemoved = true;
    } catch (error) { cleanupErrors.push(error.message); } }
    report.cleanupErrors = cleanupErrors; report.violations = violations; report.cleanup = !cleanupErrors.length;
    if (cleanupErrors.length || violations.length) { report.status = 'FAIL'; report.exitCode ||= 1; }
    report.children = children.map((entry) => ({ label: entry.label, pid: entry.process.pid, closed: entry.closed, exitCode: entry.exitCode }));
    fs.writeFileSync(path.join(reportDir, 'execution.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ layer: 'stack', status: report.status, exitCode: report.exitCode, report: path.relative(root, reportDir), stats: report.stats, error: report.error, cleanup: report.cleanup }));
    process.exitCode = report.exitCode;
  }
})();
