'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { reviewEntries } = require('../../scripts/qa/export-evidence.cjs');
test('export selection rejects stale, missing, linked, duplicate and out-of-scope evidence', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'plutus-export-test-'));
  try {
    fs.mkdirSync(path.join(temporary, 'qa/evidence'), { recursive: true });
    const file = path.join(temporary, 'qa/evidence/result.json');
    fs.writeFileSync(file, '{"synthetic":true}\n');
    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    const entry = { repository: 'fixture', path: 'qa/evidence/result.json', sha256 };
    const manifest = { schemaVersion: 1, review: { status: 'reviewed', reviewer: 'synthetic reviewer', date: '2030-01-15' }, files: [entry] };
    const repositories = { fixture: temporary };
    assert.equal(reviewEntries(manifest, repositories).length, 1);
    fs.copyFileSync(file, path.join(temporary, 'qa/frontend-testing.md'));
    assert.equal(reviewEntries({ ...manifest, files: [{ ...entry, path: 'qa/frontend-testing.md' }] }, repositories).length, 1);
    const rejected = (files) => assert.throws(() => reviewEntries({ ...manifest, files }, repositories));
    rejected([entry, entry]);
    if (process.platform === 'win32') rejected([entry, { ...entry, path: 'qa/evidence/RESULT.json' }]);
    rejected([{ ...entry, path: '../escape.json' }]);
    rejected([{ ...entry, path: 'qa-raw/result.json' }]);
    rejected([{ ...entry, path: 'qa/unreviewed.md' }]);
    rejected([{ ...entry, path: 'qa/evidence/missing.json' }]);
    rejected([{ ...entry, sha256: '0'.repeat(64) }]);
    assert.throws(() => reviewEntries({ ...manifest, review: { status: 'pending' } }, repositories));
    const link = path.join(temporary, 'qa/evidence/linked');
    fs.symlinkSync(path.join(temporary, 'qa/evidence'), link, 'junction');
    rejected([{ ...entry, path: 'qa/evidence/linked/result.json' }]);
    fs.unlinkSync(link);
    fs.writeFileSync(file, '{"changed":true}\n');
    rejected([entry]);
  } finally {
    const resolved = fs.realpathSync(temporary);
    if (path.dirname(resolved).toLowerCase() !== fs.realpathSync(os.tmpdir()).toLowerCase() || !path.basename(resolved).startsWith('plutus-export-test-')) throw new Error('Exporter fixture cleanup ownership mismatch');
    fs.rmSync(resolved, { recursive: true });
  }
});
