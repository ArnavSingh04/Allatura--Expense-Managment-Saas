# Frontend CI and system tests

Workflow and results recorded on 1 November 2026. The workflow runs on every branch push, including feature branches, and on pull requests targeting `main` or `develop`. It has no manual-dispatch trigger. Local policy tests check pinned actions, read-only permissions, independent checks and failure propagation. The existing mirror workflow remains unchanged. No production deployment, remote run or upload was executed for that record.

## Checks and local commands

CI installs locked dependencies into a test-owned directory. Separate jobs run component tests, legacy regressions, full and focused typechecks, lint, the production build, mocked browser tests and paired system tests.

Use the same runners locally:

```powershell
node scripts/qa/prepare.cjs --browsers
node scripts/qa/run-isolated.cjs --layer unit
node scripts/qa/run-isolated.cjs --layer legacy-unit
node scripts/qa/run-isolated.cjs --layer typecheck
node scripts/qa/run-isolated.cjs --layer qa-typecheck
node scripts/qa/run-isolated.cjs --layer lint
node scripts/qa/run-isolated.cjs --layer build
node scripts/qa/run-isolated.cjs --layer mocked-browser
```

The production build copies dependencies into its temporary stage. This keeps standalone tracing from pointing back to the development installation through an absolute junction. The recorded build passed with Auth0 dynamic-import and stale Browserslist warnings; see the dated results in [frontend-testing.md](../frontend-testing.md).

For paired system tests, prepare the backend's declared QA dependencies first, then run:

```powershell
node scripts/qa/run-isolated.cjs --layer stack
```

The stack runner uses `.qa-system-backend` in CI and the sibling `../plutus-be` locally.

## Private backend checkout

The system-test job checks out the `development` branch of `evoxedev/plutus-be` into `.qa-system-backend` and installs from its lockfile. The backend repository is private. In the frontend repository's **Settings > Secrets and variables > Actions**, configure `QA_BACKEND_READ_TOKEN` with a fine-grained token limited to that repository and **Contents: read-only**, plus the required metadata access. Obtain organisation approval if required.

The workflow passes the token only to the paired checkout. It neither persists Git credentials nor passes the token to test processes. The frontend's default `GITHUB_TOKEN` cannot provide this private cross-repository access. Hosted execution remains unverified until the secret is configured and the changes are pushed.

Tests run automatically on each branch push. Record the backend revision resolved at checkout time when interpreting a paired result. Fork pull requests do not receive repository secrets, so their system-test job cannot complete the private checkout; the job remains failed rather than being skipped.

## What the system tests cover

The stack fixture runs Next, its encrypted SDK session and proxy, the Nest API and a disposable MongoDB database. It issues sessions and JWTs with test-owned signing material. Hosted Auth0 login and refresh, email, storage and payments remain substituted or disabled.

The scenarios cover supplier creation, reload and persistence, plus denied role and foreign-organisation access with unchanged persisted state. [frontend-testing.md](../frontend-testing.md) records the outcomes, including failed intermediate runs.

## Workflow checks and evidence

```powershell
node scripts/qa/validate-ci.cjs
node --test qa/ci/validation.test.cjs qa/ci/export.test.cjs
```

These commands validate local workflow/export rules and failure propagation. They do not execute GitHub Actions. Automated deployment and rollback have not been verified. Raw logs, traces and screenshots can contain synthetic sessions and remain excluded from the reviewed submission package.
