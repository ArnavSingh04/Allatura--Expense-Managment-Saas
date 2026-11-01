'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { root, owned } = require('./ci-common.cjs');
const digest = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const reviewedDocumentPaths = new Set(['qa/frontend-testing.md', 'qa/backend-testing.md', 'qa/requirements.md', 'qa/defects.md', 'qa/review-record.md', 'qa/ci/README.md']);
function checkedPath(repository, relative) {
  if (fs.lstatSync(repository).isSymbolicLink()) throw new Error('Export repository must not be a link');
  if (typeof relative !== 'string' || !(reviewedDocumentPaths.has(relative) || /^qa\/(evidence|phase4)\/[A-Za-z0-9_./-]+\.(md|json|png)$/.test(relative)) || relative.split('/').some(x => !x || x === '.' || x === '..') || /(^|\/)(\.env|credentials)|qa-raw|trace|request-body/i.test(relative)) throw new Error('Export path is outside the explicit evidence scope');
  let current = repository;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Export refuses symbolic links and junctions');
  }
  if (!fs.lstatSync(current).isFile() || !fs.realpathSync(current).startsWith(fs.realpathSync(repository) + path.sep)) throw new Error('Export source escapes its repository');
  return current;
}
function reviewEntries(manifest, repositories) {
  if (manifest.schemaVersion !== 1 || manifest.review?.status !== 'reviewed' || !manifest.review.reviewer || !manifest.review.date || !Array.isArray(manifest.files) || !manifest.files.length) throw new Error('An explicit reviewed export manifest is required');
  const seen = new Set();
  return manifest.files.map(entry => {
    if (!Object.hasOwn(repositories, entry.repository) || !/^[a-f0-9]{64}$/.test(entry.sha256 || '')) throw new Error('Unknown repository or invalid reviewed hash');
    const key = `${entry.repository}/${entry.path}`;
    const collisionKey = process.platform === 'win32' ? key.toLowerCase() : key;
    if (seen.has(collisionKey)) throw new Error('Duplicate export entry');
    seen.add(collisionKey);
    const source = checkedPath(repositories[entry.repository], entry.path);
    const bytes = fs.readFileSync(source);
    if (digest(bytes) !== entry.sha256) throw new Error(`Evidence changed after review: ${key}`);
    // Hash selection is the approval boundary; this pattern screen is only an additional check.
    if (!entry.path.endsWith('.png') && /-----BEGIN [A-Z ]*PRIVATE KEY-----|Bearer\s+[A-Za-z0-9._-]{16,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(bytes.toString('utf8'))) throw new Error('Possible secret-bearing evidence requires review');
    return { key, bytes, sha256: entry.sha256 };
  });
}
function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== '--write')) throw new Error('Use no arguments for verification or --write for an owned local export');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'qa/phase4/export-allowlist.json'), 'utf8'));
  const repositories = { 'plutus-fe': root, 'plutus-be': path.resolve(root, '../plutus-be') };
  const files = reviewEntries(manifest, repositories);
  let destination;
  if (args[0] === '--write') {
    for (const parent of [path.join(root, '.qa-agent-work'), owned]) if (fs.lstatSync(parent).isSymbolicLink()) throw new Error('Owned export parent must not be a link');
    const parent = path.join(owned, 'exports');
    fs.mkdirSync(parent, { recursive: true });
    if (fs.lstatSync(parent).isSymbolicLink()) throw new Error('Export root must not be a link');
    destination = fs.mkdtempSync(path.join(parent, 'reviewed-'));
    for (const file of files) {
      const target = path.join(destination, file.key);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, file.bytes, { flag: 'wx' });
    }
    fs.writeFileSync(path.join(destination, 'MANIFEST.json'), JSON.stringify({ review: manifest.review, files: files.map(({ key, sha256 }) => ({ path: key, sha256 })), uploaded: false }, null, 2));
  }
  console.log(JSON.stringify({ status: 'PASS', mode: destination ? 'local-export' : 'verify-only', selectedFiles: files.length, destination: destination ? path.relative(root, destination) : null, uploaded: false }));
}
if (require.main === module) main();
module.exports = { checkedPath, reviewEntries };
