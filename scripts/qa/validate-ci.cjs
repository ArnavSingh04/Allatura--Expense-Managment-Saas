'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { root, role, yaml, dependencies } = require('./ci-common.cjs');
const { validateWorkflow, MIRROR_SHA256 } = require('./ci-policy.cjs');
const filename = path.join(root, '.github/workflows/qa.yml');
const source = fs.readFileSync(filename, 'utf8');
const result = validateWorkflow(yaml().load(source, { json: false }), role);
if (role === 'frontend') {
  // Git may normalize checkout line endings; preservation evidence separately records original bytes.
  const digest = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, '.github/workflows/main.yml'), 'utf8').replace(/\r\n/g, '\n')).digest('hex');
  if (digest !== MIRROR_SHA256) throw new Error('Existing mirror workflow changed; requires separate review');
  result.mirrorUnchanged = true;
}
result.workflowSha256 = crypto.createHash('sha256').update(source).digest('hex');
result.parser = 'js-yaml ' + JSON.parse(fs.readFileSync(path.join(dependencies(), 'node_modules/js-yaml/package.json'), 'utf8')).version;
console.log(JSON.stringify(result));
