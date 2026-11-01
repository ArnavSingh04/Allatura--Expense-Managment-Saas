'use strict';
const assert = require('node:assert/strict');
const CHECKOUT = 'actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683';
const SETUP_NODE = 'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020';
const MIRROR_SHA256 = 'b6a4cc37c65e2229d015c42ae2c4a5bf874bfe03ced48aba9e07ff685edd45cc';
function expectedWorkflow(role) {
  assert.ok(['frontend', 'backend'].includes(role));
  const layers = role === 'frontend' ? ['unit', 'legacy-unit', 'typecheck', 'qa-typecheck', 'lint', 'build', 'ci-config'] : ['unit', 'qa-unit', 'harness', 'contract', 'typecheck', 'qa-typecheck', 'lint', 'build', 'ci-config'];
  const job = (layer) => ({
    'runs-on': 'windows-2025', 'timeout-minutes': 30,
    steps: [
      { name: 'Checkout without persisted credentials', uses: CHECKOUT, with: { 'persist-credentials': false } },
      { name: 'Pinned Node and bundled npm', uses: SETUP_NODE, with: { 'node-version': '24.15.0' } },
      { name: 'Run one fail-closed QA gate', run: `node scripts/qa/ci-job.cjs --layer ${layer}` },
    ],
  });
  const checks = job('${{ matrix.layer }}');
  checks.strategy = { 'fail-fast': false, 'max-parallel': 3, matrix: { layer: layers } };
  const jobs = { checks };
  if (role === 'frontend') jobs['mocked-browser'] = job('mocked-browser');
  jobs['real-system'] = job(role === 'frontend' ? 'stack' : 'http');
  if (role === 'frontend') {
    jobs['real-system'].steps.splice(2, 0,
      { name: 'Checkout paired backend', uses: CHECKOUT, with: { repository: 'evoxedev/plutus-be', ref: 'development', path: '.qa-system-backend', 'persist-credentials': false } },
      { name: 'Prepare paired backend lockfile', run: 'node .qa-system-backend/scripts/qa/prepare.cjs' });
  }
  return { name: `${role} QA`, on: { pull_request: { branches: role === 'backend' ? ['main', 'development'] : ['main', 'develop'] }, push: { branches: role === 'backend' ? ['main', 'development'] : ['main', 'develop'] }, workflow_dispatch: {} }, permissions: { contents: 'read' }, defaults: { run: { shell: 'pwsh' } }, jobs };
}
function validateWorkflow(document, role) {
  // Exact approved structure rejects additions as well as omissions; this is not GitHub's hosted validator.
  assert.deepStrictEqual(document, expectedWorkflow(role), 'Workflow differs from the reviewed PR/push, no-upload QA policy');
  return { syntax: 'PASS', reviewedPolicy: 'PASS', role, hostedValidation: 'NOT_RUN', actionlint: 'NOT_AVAILABLE' };
}
module.exports = { expectedWorkflow, validateWorkflow, MIRROR_SHA256 };
