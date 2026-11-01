'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);
const layer = args[args.indexOf('--layer') + 1];
if (!args.includes('--layer') || !['unit', 'typecheck', 'qa-typecheck', 'lint', 'build', 'mocked-browser', 'stack', 'legacy-unit'].includes(layer)) throw new Error('Select an approved QA layer');
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`;
const reportDir = path.join(root, layer === 'mocked-browser' ? 'qa-raw/playwright-results' : 'qa-raw/vitest-results', runId);
fs.mkdirSync(reportDir, { recursive: true });
const preparedDependencies = path.join(root, '.qa-agent-work/frontend-phase-2026-11-01/dependencies');
const dependencies = fs.existsSync(path.join(preparedDependencies, 'node_modules/vitest/vitest.mjs')) ? preparedDependencies : root;
const browserRoot = path.join(root, '.qa-agent-work/frontend-phase-2026-11-01/browsers');
const report = { runId, layer, node: process.version, status: 'NOT_RUN', exitCode: null, stageRemoved: false };
let stage;
const nonce = crypto.randomBytes(16).toString('hex');
const bin = (name) => path.join(dependencies, 'node_modules', name);

function execute(command, options, timeout) {
  return new Promise((resolve) => {
    const child = cp.spawn(process.execPath, command, { ...options, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    report.ownedRootPid = child.pid; report.status = 'RUNNING';
    fs.writeFileSync(path.join(reportDir, 'execution.json'), JSON.stringify(report, null, 2));
    let stdout = '', stderr = '', error;
    const timer = setTimeout(() => {
      error = new Error('Owned QA process tree exceeded its deadline');
      // Keep the parent handle alive until its owned descendant tree is terminated.
      if (child.exitCode === null && child.pid) cp.spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, encoding: 'utf8' });
    }, timeout);
    child.stdout.on('data', (data) => { stdout += data; fs.appendFileSync(path.join(reportDir, 'stdout.log'), data); });
    child.stderr.on('data', (data) => { stderr += data; fs.appendFileSync(path.join(reportDir, 'stderr.log'), data); });
    child.on('error', (value) => { error = value; });
    child.on('close', (status) => { clearTimeout(timer); resolve({ status, stdout, stderr, error, pid: child.pid }); });
  });
}

(async () => {
try {
  if (layer === 'stack') {
    const { cleanEnvironment } = require('./ci-common.cjs');
    const child = cp.spawnSync(process.execPath, [path.join(root, 'scripts/qa/run-stack.cjs')], { cwd: root, env: cleanEnvironment(), encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, timeout: 1200000, windowsHide: true });
    process.stdout.write(child.stdout || ''); process.stderr.write(child.stderr || '');
    report.exitCode = child.status ?? 2;
    report.status = child.error || child.signal ? 'HARNESS_ERROR' : child.status === 0 ? 'PASS' : 'FAIL';
    if (child.error) report.error = child.error.message;
    const summaryLine = (child.stdout || '').trim().split(/\r?\n/).findLast((line) => line.startsWith('{'));
    if (summaryLine) {
      const summary = JSON.parse(summaryLine);
      const delegatedPath = path.resolve(root, summary.report || '');
      if (!delegatedPath.startsWith(path.join(root, 'qa-raw/playwright-results/stack-'))) throw new Error('Unexpected delegated stack report');
      const delegated = JSON.parse(fs.readFileSync(path.join(delegatedPath, 'execution.json'), 'utf8'));
      report.delegatedReport = path.relative(root, delegatedPath);
      report.stageOwner = 'run-stack.cjs'; report.stageRemoved = delegated.stageRemoved === true;
      report.cleanup = delegated.cleanup; report.stats = delegated.stats;
      if (delegated.status !== report.status || !delegated.cleanup) { report.status = 'FAIL'; report.exitCode ||= 2; }
    } else if (!child.error) throw new Error('Stack coordinator produced no result');
  } else {
    if (!fs.existsSync(bin('vitest/vitest.mjs'))) throw new Error('Prepared pinned QA dependencies are missing');
    stage = fs.mkdtempSync(path.join(os.tmpdir(), 'plutus-fe-qa-'));
    fs.writeFileSync(path.join(stage, '.qa-owned.json'), JSON.stringify({ nonce }));
    const scopes = ['src', 'public', 'scripts', 'tests', 'qa', 'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.qa.json', 'next.config.js', 'postcss.config.js', 'tailwind.config.ts', 'tailwind.config.js', 'eslint.config.mjs', 'vitest.config.mts', 'playwright.qa.config.ts'];
    const files = new Set();
    for (const flags of [['ls-files', '-z'], ['ls-files', '--others', '--exclude-standard', '-z']]) {
      for (const file of cp.execFileSync('git', ['-C', root, ...flags, '--', ...scopes], { encoding: 'utf8' }).split('\0')) if (file) files.add(file);
    }
    const manifest = [];
    for (const file of [...files].sort()) {
      if (file.startsWith('qa/evidence/') || ['.DS_Store', '.gitkeep'].includes(path.basename(file))) continue;
      if (!/\.(tsx?|jsx?|cjs|mjs|mts|json|css|svg|png|jpe?g|webp|ico|woff2?|ttf|md)$/i.test(file) || /^\.env|credential|private[-_.]?key|service[-_.]?account/i.test(path.basename(file))) throw new Error('Staging candidate requires explicit review');
      const from = path.resolve(root, file), to = path.resolve(stage, file);
      if (!from.startsWith(root + path.sep) || !to.startsWith(stage + path.sep) || !fs.lstatSync(from).isFile()) throw new Error('Unsafe staging candidate');
      fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to);
      manifest.push({ path: file, sha256: crypto.createHash('sha256').update(fs.readFileSync(from)).digest('hex') });
    }
    fs.writeFileSync(path.join(reportDir, 'source-manifest.json'), JSON.stringify(manifest, null, 2));
    fs.writeFileSync(path.join(stage, 'next-env.d.ts'), '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n');
    // Standalone tracing must see local files, not preserve an absolute junction
    // back into the shared dependency installation in its production artifact.
    if (layer === 'build') fs.cpSync(path.join(dependencies, 'node_modules'), path.join(stage, 'node_modules'), { recursive: true, dereference: true });
    else fs.symlinkSync(path.join(dependencies, 'node_modules'), path.join(stage, 'node_modules'), 'junction');
    fs.mkdirSync(path.join(stage, 'tmp'), { recursive: true });
    const env = {};
    for (const key of ['SystemRoot','WINDIR','ComSpec','PATHEXT','PATH','OS','PROCESSOR_ARCHITECTURE','NUMBER_OF_PROCESSORS']) if (process.env[key]) env[key] = process.env[key];
    Object.assign(env, { TEMP: path.join(stage, 'tmp'), TMP: path.join(stage, 'tmp'), TMPDIR: path.join(stage, 'tmp'), CI: '1', TZ: 'UTC', NODE_ENV: layer === 'unit' || layer === 'legacy-unit' ? 'test' : 'production', NEXT_TELEMETRY_DISABLED: '1',
      NODE_OPTIONS: `--require="${path.join(stage, 'qa/harness/node-guard.cjs').split(path.sep).join('/')}"`,
      PLUTUS_QA_STAGE_ROOT: stage, PLUTUS_QA_DEPENDENCIES: layer === 'build' ? stage : dependencies, PLUTUS_QA_REPORT_DIR: reportDir, PLUTUS_QA_LAYER: layer,
      PLUTUS_QA_COVERAGE_DIR: path.join(root, 'qa-raw/vitest-coverage', runId),
      PLUTUS_QA_BROWSER_OUTPUT: path.join(reportDir, 'artifacts'), PLUTUS_QA_BROWSER_HTML: path.join(root, 'qa-raw/playwright-report', runId), PLUTUS_QA_BROWSER_JSON: path.join(reportDir, 'playwright.json'),
      PLAYWRIGHT_BROWSERS_PATH: browserRoot,
      NEXT_FONT_GOOGLE_MOCKED_RESPONSES: path.join(stage, 'qa/harness/font-responses.cjs'),
      AUTH0_DOMAIN: 'qa.invalid', AUTH0_CLIENT_ID: 'qa-synthetic-client', AUTH0_CLIENT_SECRET: 'qa-synthetic-client-secret', AUTH0_SECRET: '0'.repeat(64), APP_BASE_URL: 'http://127.0.0.1:1',
      BACKEND_API_URL: 'http://127.0.0.1:1/v1', INTERNAL_BACKEND_URL: 'http://127.0.0.1:1/v1',
    });
    if (args.includes('--project')) {
      const project = args[args.indexOf('--project') + 1];
      if (!['chromium', 'firefox', 'webkit'].includes(project)) throw new Error('Unknown browser project');
      env.PLUTUS_QA_BROWSER_PROJECT = project; report.browserProject = project;
    }
    if (args.includes('--max-failures=1')) { env.PLUTUS_QA_MAX_FAILURES = '1'; report.maxFailures = 1; }
    const commands = {
      unit: [bin('vitest/vitest.mjs'), 'run', '--config', 'vitest.config.mts', '--configLoader', 'native', '--coverage', '--reporter=default', '--reporter=json', `--outputFile.json=${path.join(reportDir, 'vitest.json')}`],
      typecheck: [bin('typescript/bin/tsc'), '--noEmit', '--incremental', 'false', '-p', 'tsconfig.json'],
      'qa-typecheck': [bin('typescript/bin/tsc'), '--noEmit', '--incremental', 'false', '-p', 'tsconfig.qa.json'],
      lint: [bin('eslint/bin/eslint.js'), '.', '--format', 'json', '--output-file', path.join(reportDir, 'eslint.json')],
      build: [path.join(stage, 'node_modules/next/dist/bin/next'), 'build', '--webpack'],
      'mocked-browser': [path.join(stage, 'qa/harness/run-browser.cjs')],
      'legacy-unit': [path.join(stage, 'scripts/workspaces.test.cjs')],
    };
    report.command = [process.execPath, ...commands[layer]]; report.cwd = stage;
    const started = Date.now();
    const result = await execute(commands[layer], { cwd: stage, env }, layer === 'mocked-browser' ? 1200000 : 300000);
    report.ownedRootPid = result.pid;
    report.durationMs = Date.now() - started; report.exitCode = result.status ?? 2;
    report.status = result.error ? 'HARNESS_ERROR' : result.status === 0 ? 'PASS' : 'FAIL';
    if (result.error) report.error = result.error.message;
    for (const [name, data] of [['stdout.log', result.stdout], ['stderr.log', result.stderr]]) fs.writeFileSync(path.join(reportDir, name), data || '');
    process.stdout.write(result.stdout || ''); process.stderr.write(result.stderr || '');
  }
} catch (error) { report.status = 'HARNESS_ERROR'; report.exitCode = 2; report.error = error.message; console.error(error.message); }
finally {
  if (stage) {
    try {
      const real = fs.realpathSync(stage), temp = fs.realpathSync(os.tmpdir());
      if (path.dirname(real).toLowerCase() !== temp.toLowerCase() || !path.basename(real).startsWith('plutus-fe-qa-') || JSON.parse(fs.readFileSync(path.join(real, '.qa-owned.json'), 'utf8')).nonce !== nonce) throw new Error('Cleanup ownership mismatch');
      const junction = path.join(real, 'node_modules');
      if (fs.existsSync(junction)) { if (fs.lstatSync(junction).isSymbolicLink()) fs.unlinkSync(junction); else if (layer !== 'build') throw new Error('Unexpected dependency target'); }
      fs.rmSync(real, { recursive: true }); report.stageRemoved = true;
    } catch (error) { report.cleanupError = error.message; report.status = 'HARNESS_ERROR'; report.exitCode = 2; }
  }
  fs.writeFileSync(path.join(reportDir, 'execution.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ layer, status: report.status, exitCode: report.exitCode, report: path.relative(root, reportDir), stageRemoved: report.stageRemoved }));
  process.exitCode = report.exitCode ?? 2;
}
})();
