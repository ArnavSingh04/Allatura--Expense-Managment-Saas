'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const { root, role, cleanEnvironment } = require('./ci-common.cjs');
const args = process.argv.slice(2);
const layer = args[1];
const approved = role === 'frontend' ? ['unit', 'legacy-unit', 'typecheck', 'qa-typecheck', 'lint', 'build', 'mocked-browser', 'stack', 'ci-config'] : ['unit', 'qa-unit', 'harness', 'contract', 'typecheck', 'qa-typecheck', 'lint', 'build', 'http', 'ci-config'];
if (args.length !== 2 || args[0] !== '--layer' || !approved.includes(layer)) throw new Error('Select an approved CI layer');
const npmVersion = JSON.parse(fs.readFileSync(path.join(path.dirname(process.execPath), 'node_modules/npm/package.json'), 'utf8')).version;
if (process.platform !== 'win32' || process.version !== 'v24.15.0' || npmVersion !== '11.12.1') throw new Error('Prepared CI requires Windows, Node 24.15.0 and bundled npm 11.12.1');
function run(command) {
  const child = cp.spawnSync(process.execPath, command, { cwd: root, env: cleanEnvironment(), stdio: 'inherit', windowsHide: true });
  if (child.error || child.signal || child.status !== 0) { process.exitCode = child.status || 2; return false; }
  return true;
}
if (run(['scripts/qa/prepare.cjs', ...(['mocked-browser', 'stack'].includes(layer) ? ['--browsers'] : [])])) {
  if (layer === 'ci-config') {
    if (run(['scripts/qa/validate-ci.cjs'])) run(['--test', 'qa/ci/validation.test.cjs', 'qa/ci/export.test.cjs']);
  } else run(['scripts/qa/run-isolated.cjs', '--layer', layer]);
}
