'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../..');
const role = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).name === 'selle-backend' ? 'backend' : 'frontend';
const owned = path.join(root, '.qa-agent-work/ci-phase-2026-11-01');
function dependencies() {
  const candidate = path.join(root, role === 'frontend' ? '.qa-agent-work/frontend-phase-2026-11-01/dependencies' : '.qa-agent-work/ci-phase-2026-11-01/dependencies');
  return fs.existsSync(path.join(candidate, 'node_modules/js-yaml/package.json')) ? candidate : root;
}
function cleanEnvironment() {
  const env = {};
  for (const key of ['SystemRoot', 'WINDIR', 'ComSpec', 'PATHEXT', 'PATH', 'TEMP', 'TMP', 'OS', 'PROCESSOR_ARCHITECTURE', 'NUMBER_OF_PROCESSORS']) if (process.env[key]) env[key] = process.env[key];
  return { ...env, CI: '1', TZ: 'UTC', NEXT_TELEMETRY_DISABLED: '1', MONGOMS_RUNTIME_DOWNLOAD: 'false', MONGOMS_DISABLE_POSTINSTALL: '1' };
}
function yaml() { return createRequire(path.join(dependencies(), 'package.json'))('js-yaml'); }
module.exports = { root, role, owned, dependencies, cleanEnvironment, yaml };
