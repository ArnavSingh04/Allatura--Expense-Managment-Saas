'use strict';

const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const owned = path.join(root, '.qa-agent-work/frontend-phase-2026-11-01');
const dependencies = path.join(owned, 'dependencies');
const reportDir = path.join(owned, 'preparation');
fs.mkdirSync(dependencies, { recursive: true }); fs.mkdirSync(reportDir, { recursive: true });
fs.mkdirSync(path.join(owned, 'tmp'), { recursive: true });
for (const file of ['package.json', 'package-lock.json']) fs.copyFileSync(path.join(root, file), path.join(dependencies, file));
for (const file of ['user.npmrc', 'global.npmrc']) fs.writeFileSync(path.join(owned, file), '');
const env = {};
for (const key of ['SystemRoot','WINDIR','ComSpec','PATHEXT','PATH','OS','PROCESSOR_ARCHITECTURE','NUMBER_OF_PROCESSORS']) if (process.env[key]) env[key] = process.env[key];
Object.assign(env, { CI: '1', TEMP: path.join(owned, 'tmp'), TMP: path.join(owned, 'tmp'), npm_config_userconfig: path.join(owned, 'user.npmrc'), npm_config_globalconfig: path.join(owned, 'global.npmrc'), npm_config_registry: 'https://registry.npmjs.org/', npm_config_cache: path.join(owned, 'npm-cache'), PLAYWRIGHT_BROWSERS_PATH: path.join(owned, 'browsers'), PLAYWRIGHT_SKIP_BROWSER_GC: '1', PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1' });
const npm = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const browserOnly = process.argv.includes('--browsers-only');
const commands = browserOnly ? [] : [[npm, 'ci', '--ignore-scripts', '--no-audit', '--no-fund']];
if (process.argv.includes('--browsers') || browserOnly) commands.push([path.join(dependencies, 'node_modules/@playwright/test/cli.js'), 'install', 'chromium', 'firefox', 'webkit']);
const results = [];
for (const args of commands) {
  const result = cp.spawnSync(process.execPath, args, { cwd: dependencies, env, encoding: 'utf8', timeout: 600000, maxBuffer: 20 * 1024 * 1024, windowsHide: true });
  const id = results.length;
  fs.writeFileSync(path.join(reportDir, `${id}-stdout.log`), result.stdout || ''); fs.writeFileSync(path.join(reportDir, `${id}-stderr.log`), result.stderr || '');
  results.push({ command: [process.execPath, ...args], exitCode: result.status, error: result.error?.message });
  if (result.status !== 0 || result.error) { process.exitCode = result.status || 2; break; }
}
fs.writeFileSync(path.join(reportDir, 'execution.json'), JSON.stringify({ preparationOnly: true, applicationStarted: false, results }, null, 2));
console.log(JSON.stringify({ preparationOnly: true, results }));
