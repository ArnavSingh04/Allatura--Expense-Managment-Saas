'use strict';

const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const dns = require('node:dns');
const cp = require('node:child_process');
const { syncBuiltinESMExports } = require('node:module');
const stage = process.env.PLUTUS_QA_STAGE_ROOT;
const dependencies = process.env.PLUTUS_QA_DEPENDENCIES;
const report = process.env.PLUTUS_QA_REPORT_DIR;
if (!stage || !dependencies || !report) throw new Error('QA isolation: runner ownership missing');
const originalRealpath = fs.realpathSync;
const originalExists = fs.existsSync;
const roots = [stage, report, process.env.PLUTUS_QA_COVERAGE_DIR, process.env.PLUTUS_QA_BROWSER_OUTPUT, process.env.PLUTUS_QA_BROWSER_HTML].filter(Boolean).map((p) => path.resolve(p));
const ownedPorts = new Set(JSON.parse(process.env.PLUTUS_QA_PORTS || '[]').map(Number));
const childPids = new Set();
const own = (base, target) => target === base || target.startsWith(base + path.sep);

function sensitive(file) {
  if (typeof file === 'number') return false;
  const name = file instanceof URL ? file.pathname : String(file);
  return name.split(/[\\/]/).some((part) => /^\.env(?:\.|$)/i.test(part)) || /(^|[\\/])(\.aws|\.azure|\.ssh|\.codex|gcloud|credentials|\.npmrc|\.netrc)([\\/]|$)/i.test(name) || /\.(pem|p12|pfx|key)$/i.test(name);
}
function readable(file) { if (sensitive(file)) throw new Error('QA isolation: sensitive file access denied'); }
function writable(file) {
  if (typeof file === 'number') return;
  let resolved = path.resolve(file instanceof URL ? require('node:url').fileURLToPath(file) : String(file));
  const tail = [];
  while (!originalExists(resolved)) { const parent = path.dirname(resolved); if (parent === resolved) throw new Error('QA isolation: unresolved destination'); tail.unshift(path.basename(resolved)); resolved = parent; }
  resolved = path.resolve(originalRealpath(resolved), ...tail);
  if (!roots.some((root) => own(root, resolved))) throw new Error('QA isolation: write outside owned output denied');
}
for (const name of ['readFile', 'readFileSync', 'createReadStream']) {
  const original = fs[name]; fs[name] = function (file, ...args) { readable(file); return original.call(this, file, ...args); };
}
const readPromise = fs.promises.readFile;
fs.promises.readFile = async function (file, ...args) { readable(file); return readPromise.call(this, file, ...args); };
for (const [api, name] of [[fs, 'open'], [fs, 'openSync'], [fs.promises, 'open']]) {
  const original = api[name]; api[name] = function (file, flags, ...args) {
    readable(file);
    const writes = typeof flags === 'number' ? flags & (fs.constants.O_WRONLY | fs.constants.O_RDWR | fs.constants.O_CREAT | fs.constants.O_TRUNC | fs.constants.O_APPEND) : /[wa+]/.test(String(flags));
    if (writes) writable(file);
    return original.call(this, file, flags, ...args);
  };
}
for (const name of ['writeFile', 'appendFile', 'mkdir', 'mkdtemp', 'rm', 'rmdir', 'unlink', 'truncate', 'chmod', 'chown', 'utimes']) {
  for (const [api, key] of [[fs, name], [fs, name + 'Sync'], [fs.promises, name]]) {
    if (!api[key]) continue;
    const original = api[key]; api[key] = function (file, ...args) { writable(file); return original.call(this, file, ...args); };
  }
}
const writeStream = fs.createWriteStream;
fs.createWriteStream = function (file, ...args) { writable(file); return writeStream.call(this, file, ...args); };
for (const name of ['rename', 'copyFile']) {
  for (const [api, key] of [[fs, name], [fs, name + 'Sync'], [fs.promises, name]]) {
    const original = api[key]; api[key] = function (from, to, ...args) { readable(from); if (name === 'rename') writable(from); writable(to); return original.call(this, from, to, ...args); };
  }
}
for (const name of ['cp', 'link', 'symlink']) {
  for (const [api, key] of [[fs, name], [fs, name + 'Sync'], [fs.promises, name]]) api[key] = function () { throw new Error('QA isolation: bulk copy or link creation denied'); };
}

const target = (args) => { const first = Array.isArray(args[0]) ? args[0][0] : args[0]; return typeof first === 'object' && first !== null ? first : { port: first, host: typeof args[1] === 'string' ? args[1] : undefined }; };
const allowed = (host, port) => host === '127.0.0.1' && ownedPorts.has(Number(port));
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) { const dest = target(args); if (!allowed(dest.host, dest.port) || dest.path) throw new Error('QA isolation: non-fixture connection denied'); return connect.apply(this, args); };
const listen = net.Server.prototype.listen;
net.Server.prototype.listen = function (...args) {
  const dest = target(args);
  if (dest.host !== '127.0.0.1' || (Number(dest.port) !== 0 && !ownedPorts.has(Number(dest.port))) || dest.path) throw new Error('QA isolation: non-owned listener denied');
  this.once('listening', () => { const a = this.address(); if (a && typeof a === 'object') { ownedPorts.add(a.port); this.once('close', () => ownedPorts.delete(a.port)); } });
  return listen.apply(this, args);
};
for (const api of [dns, dns.promises, dns.Resolver.prototype, dns.promises.Resolver.prototype]) {
  for (const key of Object.getOwnPropertyNames(api).filter((key) => /^(lookup|resolve|reverse)/.test(key))) {
    const original = api[key]; if (typeof original !== 'function') continue;
    api[key] = function (host, ...args) { if (key === 'lookup' && host === '127.0.0.1') return original.call(this, host, ...args); throw new Error('QA isolation: DNS denied'); };
  }
}
require('node:dgram').createSocket = function () { throw new Error('QA isolation: UDP denied'); };
const originalFetch = globalThis.fetch;
globalThis.fetch = function (input, options) {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (!allowed(url.hostname, url.port || (url.protocol === 'https:' ? 443 : 80))) throw new Error('QA isolation: non-fixture fetch denied');
  return originalFetch(input, options);
};

function checkChild(file, args = [], options = {}) {
  if (options.shell) throw new Error('QA isolation: child shell denied');
  if (options.execPath && path.resolve(options.execPath).toLowerCase() !== process.execPath.toLowerCase()) throw new Error('QA isolation: alternate fork executable denied');
  const full = path.resolve(file);
  const script = args[0];
  const scriptPath = script ? path.resolve(script) : '';
  const allowedNodeScripts = [
    path.join(stage, 'qa/harness/next-server.cjs'),
    path.join(dependencies, 'node_modules/next/dist/compiled/jest-worker/processChild.js'),
    path.join(dependencies, 'node_modules/next/dist/server/lib/start-server.js'),
    path.join(dependencies, 'node_modules/playwright/lib/common/process.js'),
    path.join(dependencies, 'node_modules/@playwright/test/cli.js'),
  ];
  const nodeAllowed = full.toLowerCase() === process.execPath.toLowerCase() && allowedNodeScripts.includes(scriptPath) && !args.some((arg) => /^(-e|--eval|-r|--require|--import)(=|$)/.test(arg));
  const esbuildAllowed = process.env.PLUTUS_QA_LAYER === 'unit' && full === path.join(dependencies, 'node_modules/@esbuild/win32-x64/esbuild.exe') && args.every((arg) => /^--service=[\d.]+$|^--ping$/.test(arg));
  const browserRoot = process.env.PLAYWRIGHT_BROWSERS_PATH;
  const browserAllowed = ['mocked-browser', 'stack'].includes(process.env.PLUTUS_QA_LAYER) && browserRoot && own(path.resolve(browserRoot), full) && /^(chrome-headless-shell|chrome|firefox|Playwright|MiniBrowser)\.exe$/i.test(path.basename(full));
  const pidIndex = args.findIndex((arg) => /^\/pid$/i.test(arg));
  const killAllowed = /^taskkill(?:\.exe)?$/i.test(path.basename(file)) && pidIndex >= 0 && childPids.has(Number(args[pidIndex + 1])) && args.every((arg, i) => i === pidIndex + 1 || /^\/(pid|t|f)$/i.test(arg));
  if (!nodeAllowed && !esbuildAllowed && !browserAllowed && !killAllowed) throw new Error('QA isolation: unapproved child process denied');
  if (options.cwd && !own(stage, path.resolve(options.cwd))) throw new Error('QA isolation: child working directory denied');
  if (nodeAllowed) {
    const execArgs = options.execArgv || [];
    for (let i = 0; i < execArgs.length; i++) {
      const arg = execArgs[i];
      if (arg === '--require' || arg === '-r') {
        if (path.resolve(execArgs[++i] || '') !== path.join(stage, 'qa/harness/node-guard.cjs')) throw new Error('QA isolation: unexpected child preload');
      } else if (!/^--enable-source-maps$|^--max[-_]old[-_]space[-_]size=\d+$/.test(arg)) throw new Error('QA isolation: unexpected child Node option');
    }
    if (options.env) {
      if (options.env.PLUTUS_QA_STAGE_ROOT !== stage) throw new Error('QA isolation: child ownership lost');
      // Next reformats NODE_OPTIONS and can move the preload into execArgv. Restore our canonical preload.
      options.env.NODE_OPTIONS = process.env.NODE_OPTIONS;
    }
  }
}
for (const key of ['spawn', 'spawnSync', 'execFile', 'execFileSync']) {
  const original = cp[key]; cp[key] = function (file, args, options, ...rest) {
    const kill = typeof file === 'string' && /^taskkill \/pid (\d+) \/T \/F$/.exec(file);
    if (key === 'spawnSync' && kill && childPids.has(Number(kill[1]))) return original.call(this, 'taskkill', ['/pid', kill[1], '/T', '/F'], { ...args, shell: false, windowsHide: true });
    checkChild(file, Array.isArray(args) ? args : [], (Array.isArray(args) ? options : args) || {});
    const child = original.call(this, file, args, options, ...rest);
    if (child?.pid && child.once) { childPids.add(child.pid); child.once('exit', () => childPids.delete(child.pid)); }
    return child;
  };
}
const fork = cp.fork;
cp.fork = function (file, args, options) { checkChild(process.execPath, [file, ...(Array.isArray(args) ? args : [])], (Array.isArray(args) ? options : args) || {}); const child = fork.call(this, file, args, options); childPids.add(child.pid); child.once('exit', () => childPids.delete(child.pid)); return child; };
for (const key of ['exec', 'execSync']) cp[key] = function () { throw new Error('QA isolation: shell process denied'); };

Object.defineProperty(process, 'plutusQaGuard', { value: true });
syncBuiltinESMExports();
const proofDir = path.join(report, 'worker-proofs');
fs.mkdirSync(proofDir, { recursive: true });
fs.writeFileSync(path.join(proofDir, `${process.pid}-${require('node:worker_threads').threadId}.json`), JSON.stringify({ pid: process.pid, threadId: require('node:worker_threads').threadId, guardLoaded: true, syntheticReadDenied: (() => { try { fs.readFileSync(path.join(stage, '.env.synthetic-probe')); return false; } catch (error) { return error.message.includes('QA isolation: sensitive file'); } })() }));
module.exports = { registerOwnedPort(port) { ownedPorts.add(Number(port)); }, removeOwnedPort(port) { ownedPorts.delete(Number(port)); } };
