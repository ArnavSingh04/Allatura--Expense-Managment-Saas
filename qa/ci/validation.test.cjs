'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { expectedWorkflow, validateWorkflow } = require('../../scripts/qa/ci-policy.cjs');
const { yaml } = require('../../scripts/qa/ci-common.cjs');
for (const role of ['frontend', 'backend']) test(`${role}: approved policy keeps every full check and real-system gate independent`, () => {
  assert.equal(validateWorkflow(expectedWorkflow(role), role).reviewedPolicy, 'PASS');
});
const corruptions = {
  'missing push trigger': (w) => { delete w.on.push; },
  'exclude feature branch pushes': (w) => { w.on.push.branches = ['main']; },
  'manual dispatch trigger': (w) => { w.on.workflow_dispatch = {}; },
  'missing paired backend read token': (w) => { delete w.jobs['real-system'].steps[2].with.token; },
  'missing pull-request trigger': (w) => { delete w.on.pull_request; },
  'unsafe privileged trigger': (w) => { w.on.pull_request_target = {}; },
  'write permissions': (w) => { w.permissions.contents = 'write'; },
  'continue on error': (w) => { w.jobs.checks['continue-on-error'] = true; },
  'cancel sibling failures': (w) => { w.jobs.checks.strategy['fail-fast'] = true; },
  'omit full unit gate': (w) => { w.jobs.checks.strategy.matrix.layer.shift(); },
  'mutable action': (w) => { w.jobs.checks.steps[0].uses = 'actions/checkout@v4'; },
  'persist credentials': (w) => { w.jobs.checks.steps[0].with['persist-credentials'] = true; },
  'swallow exit': (w) => { w.jobs.checks.steps[2].run += ' || true'; },
  'upload raw artifacts': (w) => { w.jobs.checks.steps.push({ uses: 'actions/upload-artifact@v4', with: { path: 'qa-raw/**' } }); },
  'inject secret': (w) => { w.jobs.checks.env = { TOKEN: '${{ secrets.TOKEN }}' }; },
  'skip real-system gate': (w) => { w.jobs['real-system'].if = false; },
};
for (const [name, change] of Object.entries(corruptions)) test(`reject ${name}`, () => {
  const value = expectedWorkflow('frontend'); change(value);
  assert.throws(() => validateWorkflow(value, 'frontend'));
});
test('YAML parser rejects duplicate keys and multiple documents', () => {
  assert.throws(() => yaml().load('name: a\nname: b\n', { json: false }));
  assert.throws(() => yaml().load('name: a\n---\nname: b\n', { json: false }));
});
