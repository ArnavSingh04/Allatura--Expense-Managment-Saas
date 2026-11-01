# Frontend and browser QA — 1 November 2026

## Remediation addendum — 1 November 2026, after implementation approval

The user subsequently authorised product fixes, isolated backend integration and CI preparation. This addendum supersedes the earlier phase's current-status claims below; the earlier dated observations and evidence remain preserved.

The organisation session now exposes the selected membership, binds scoped requests to the tab's organisation and ignores stale identity responses. Existing invitation acceptance and organisation selection expectations now pass without changing their assertions. A real contract detail route replaces the 404. Login return validation rejects backslashes/external destinations, and the first client render agrees with server hydration. Upload failures remain visible and retryable; a stub storage URL cannot report a completed upload. Supplier and expense dialogs have named close buttons and prevent dismissal while saving. Product lint findings were fixed without broad rule suppression.

| Check (run with `node scripts/qa/run-isolated.cjs --layer <layer>`) | Result | Raw report directory beneath `qa-raw/` |
|---|---|---|
| `unit` | PASS, 67/67 across 12 files: 59 product cases plus 8 harness probes | `vitest-results/2026-11-01T10-39-42-942Z-ab578655` |
| `legacy-unit` | PASS, all 14 original assertions | `vitest-results/2026-11-01T10-32-08-421Z-f1925f0f` |
| `typecheck` | PASS, full application/test TypeScript check | `vitest-results/2026-11-01T10-39-42-928Z-756598c3` |
| `lint` | PASS, zero errors/warnings | `vitest-results/2026-11-01T10-39-42-931Z-db57e0f2` |
| `build` | PASS, production compilation, TypeScript, 24 static pages and standalone tracing | `vitest-results/2026-11-01T10-40-42-422Z-f001905d` |
| `mocked-browser` | PASS, 39/39 slots: 13 scenarios across Chromium, Firefox and WebKit; zero retries/skips | `playwright-results/2026-11-01T10-40-13-193Z-67ada458` |
| `stack` | PASS, 3/3 real frontend/API/database scenarios in Chromium; zero retries/skips/flaky results | `playwright-results/stack-2026-11-01T10-41-15-572Z-3c6d4040` |

The stack runner starts a disposable Mongo process and real Nest application, uses the real Next API proxy, and drives the actual supplier UI. It proves owner creation persists after reload, reader create is denied with unchanged records, and another organisation cannot read/alter a supplier or forge its organisation selection. Valid read controls accompany denial assertions. Locally issued JWTs and Auth0 SDK-encrypted sessions provide **synthetic identity**; hosted login, OAuth callback and external providers are not tested. Only the font stylesheet is locally fulfilled in this suite; API/auth/profile responses are not intercepted. The backend descriptor and session credentials stay in the temporary owned stage, which the successful run removed. Its recorded service exits are all zero, cleanup is true, and traffic violations are empty.

The first two stack attempts remain failed in raw evidence: one native worker exit, then an initial browser syntax error. The coordinator was corrected to explicitly forward only the owned Next HMR WebSocket upgrade; the complete third run passes, as does the independent subsequent three-case run listed above. This does not establish the cause of the earlier native worker exit. The earlier outer stack wrapper reported `stageRemoved:false` because it had no stage of its own; the nested coordinator's `execution.json` is the lifecycle authority for those runs. The final outer report `vitest-results/2026-11-01T10-41-15-511Z-abcfd20b` now delegates the actual stats, cleanup and stage ownership correctly. Failed runs have not been relabelled or removed.

Current unit coverage is **15.91% statements/lines (2295/14424), 70.06% branches (426/608), and 55.01% functions (170/309)**. This remains limited application-wide coverage. Server handlers, the Auth0 boundary and proxy are excluded from the component coverage denominator; their real stack assertions are separate evidence and are not merged into that percentage. Build warnings about the Auth0 dynamic dependency and old Browserslist data remain visible.

Remaining submission gaps include broader core workflows and adverse-state coverage, external storage/payment/email delivery, actual hosted authentication, human accessibility review and named stakeholder UAT acceptance. Automated review is not human peer sign-off. Local passing gates and prepared CI do not establish a hosted CI run, a production deployment or deployment approval. See the current [requirements](requirements.md) and [defect status](defects.md).

## Historical initial frontend phase — retained unchanged

This phase implements the approved frontend/component and browser testing scope. Product source, pre-existing WIP, backend files, workflows and deployment settings were not changed. Real FE-to-BE integration remains **BLOCKED**: no approved disposable backend/database environment with verified native-process network containment is available. No database connection, seed, reset, payment, email or live storage operation was attempted.

## Results and commands

Run these one-shot commands from the frontend root. They create a new owned source stage, use only synthetic configuration, record results under ignored output directories, and remove that stage. None starts a watch-mode test session. The browser layer deliberately starts and later closes an owned Next development server; its lifecycle belongs to the test command.

| Command | Recorded result and boundary |
|---|---|
| `node scripts/qa/run-isolated.cjs --layer unit` / `npm test` | PASS: 37 component cases plus 8 harness probes, 45 total across 7 files; mocked service/auth/navigation boundaries |
| `node scripts/qa/run-isolated.cjs --layer legacy-unit` | FAIL: preserved WIP script, 6 passed / 8 failed / 14 total; VM/transpile mocks, not browser or server-security evidence |
| `node scripts/qa/run-isolated.cjs --layer typecheck` / `npm run typecheck` | FAIL, child exit 2: five diagnostics in preserved `OrganisationSwitcher.tsx` |
| `node scripts/qa/run-isolated.cjs --layer qa-typecheck` | PASS: all new tests/configs and their imported source; complementary to the failed full check |
| `node scripts/qa/run-isolated.cjs --layer lint` / `npm run lint` | FAIL: 13 errors and 4 warnings under the installed Next core-web-vitals/TypeScript configuration; no findings in new QA/test files |
| `node scripts/qa/run-isolated.cjs --layer build` | FAIL: actual Next 16.2.1 webpack production build compiles, then fails on preserved organisation-switcher types; no ignoreBuildErrors setting |
| `node scripts/qa/run-isolated.cjs --layer mocked-browser` / `npm run test:browser` | FAIL, exit 1: 24 passed / 15 failed / 39 executed; 13 distinct scenarios across Chromium, Firefox and WebKit; zero skips/retries |
| `node scripts/qa/run-isolated.cjs --layer stack` / `npm run test:stack` | BLOCKED, gate exit 2 before service setup/seeding; this is a fail-closed gate, not an implemented full-stack runner |

The [execution summary](evidence/frontend-phase-summary.json) records final and intermediate run IDs, commands, exit codes, exact counts, diagnostics, worker proofs and source/artifact hashes. Windows shell tooling may expose a failed native command as shell exit 1 when its recorded child exit is 2. Intermediate smoke selections use explicit `--project` and `--max-failures=1`; unexecuted scenarios in those attempts are NOT RUN, not passes or source-level skips. Such diagnostic selections are separate from the final matrix. Failed harness attempts and aborted runs remain retained.

Final matrix run: `2026-11-01T09-37-10-901Z-c0449530`.

| Engine | Passed | Failed | Executed |
|---|---:|---:|---:|
| Chromium | 9 | 4 | 13 |
| Firefox | 10 | 3 | 13 |
| WebKit | 5 | 8 | 13 |

The 15 failed slots comprise three contract-detail 404s, three invalid backslash-return forwarding failures, eight hydration-only failures and one Firefox context-teardown protocol failure. Two of the 404 cases also report hydration errors; these are not additional failed slots. The Firefox teardown failure is tooling evidence: offline trace review confirms its functional and boundary assertions completed before context close failed. Owned server shutdown completed with exit 0; final lifecycle and every per-test boundary recorded no unexpected traffic. The final run removed its temporary stage. A subsequent [process check](evidence/final-process-check.json) found no live matches for its 48 recorded Node PIDs or the task-owned browser executable directory; it stopped no processes and inspected no command lines.

Component-run V8 coverage is statements/lines **12.60% (1797/14255)**, branches **70.72% (331/468)**, and functions **53.26% (147/276)**. These are provider-reported denominators for this run, not a claim of broad risk coverage. The collection includes `src/**/*.{ts,tsx}` and uncovered files, excluding declaration files, API route handlers, `src/proxy.ts` and `src/lib/auth0.ts` because those server boundaries are not exercised by component tests. Per-file data is [versioned separately](evidence/component-coverage.json). Browser, legacy VM and component results are not merged into an inflated coverage percentage or unique-scenario count. No target was invented.

## Versions, preparation and lint

Verified application/runtime versions: Next 16.2.1, React/React DOM 19.2.4, TypeScript 5.9.3, Node 24.15.0, npm 11.12.1, Auth0 SDK 4.27.0, ESLint 9.39.4 and eslint-config-next 16.2.1. Application dependency ranges and all **904 pre-existing locked package versions/integrity values** are unchanged. The coordinator added 196 lock entries for test tooling and its dependencies.

Exact new development pins: Vitest and `@vitest/coverage-v8` 3.2.6, Vite 6.4.1, React Testing Library 16.3.0, DOM Testing Library 10.4.1, user-event 14.6.1, jest-dom 6.9.1, jsdom 26.1.0 and Playwright 1.58.2. The direct `@types/estree` 1.0.8 pin retains the existing transitive version while new Rollup receives its newer compatible types in a nested entry. Registry engine/peer metadata was checked against Node 24 and React 19; no arbitrary latest/framework upgrade was used. See the [Vitest 3 guide](https://v3.vitest.dev/guide/) and [React Testing Library installation guidance](https://testing-library.com/docs/react-testing-library/intro/).

Matching Playwright binaries were downloaded into the owned QA directory: Chromium/headless-shell revision 1208 (145.0.7632.6), Firefox 1509 (146.0.1), WebKit 2248 (26.0), plus their published utility binaries. Existing browser profiles and the unrelated cached Chromium revision were not used. Public registry/browser retrieval was preparation traffic, separate from application test traffic.

For a fresh checkout on the validated Windows/Node/npm toolchain, `node scripts/qa/prepare.cjs --browsers` installs the locked dependencies with lifecycle scripts disabled into the owned QA dependency directory and retrieves those matching browsers. It supplies empty task-owned npm configs, a task-owned cache and a minimal environment, and does not replace the checkout's existing dependencies. The preparatory commands used during this phase and their outcomes are retained in selected evidence. This reusable preparation wrapper was syntax-checked; its equivalent npm/browser CLI operations were executed during setup. `--browsers-only` retrieves browsers without rerunning npm CI. Inspect any new lock changes before future preparation.

`eslint.config.mjs` applies the installed Next core-web-vitals and TypeScript flat configs. CommonJS files are treated as CommonJS, with only the incompatible require-import prohibition disabled for that format. Product TypeScript/React rules remain enabled; no automatic fix, blanket source ignore or suppression was added to obtain a green lint result. Generated output, dependency directories and agent notes are excluded. All surfaced existing findings remain in the evidence.

## Layer boundaries and requirements

[The requirements map](requirements.md) names the actual scenarios and fixtures. Components render actual React/MUI widgets, real RBAC, money conversion and SWR where relevant; only service/auth/navigation dependencies are doubled. Assertions use accessible roles, labels and user interactions, controlled pending promises, exact payloads and visible state. Service rejection fixtures do not prove that the backend implements that rejection. Billing tests do not contact a payment provider or prove server role enforcement.

The component alias configuration covers the selected imports, including `src/services`. It does not reproduce TypeScript's secondary `src/app/services` fallback; tests for modules using that fallback will require an explicit compatible mapping before inclusion.

Async `RootLayout`/cookies and real Next routing are exercised by browser tests, not forced into Vitest. This follows [Next's guidance on async Server Components](https://nextjs.org/docs/app/guides/testing). Browser fixtures replace Auth0 profile/login and domain API responses. They exercise route rendering, navigation, keyboards, mobile layout and recovery, but not real Auth0 callbacks, the Nest contract, persisted mutations or tenant isolation. The synthetic login completion link belongs only to the fixture.

Browser bootstrap uses the real source and WIP without replacing routes, middleware or components. It runs a custom **development webpack** server with synthetic SDK settings and an exact owned backend rejection endpoint. The public client API base is `/api/v1`. Next's installed local font-response hook and one exact CSS-request fixture avoid Google font traffic; browser font metrics use system fallback fonts. The actual root layout, auth context and client API modules still execute. Development route results are not evidence that the failed production build can ship.

The protected deep-link destination and ordinary safe `returnTo` are preserved in observed browser navigation; the old ignored-return lead was not reproduced. Actual contract navigation reaches a missing route/404 and remains red. Backslash-form forwarding is a narrower login-shim validation failure; the installed SDK's later origin normalizer rejects cross-origin destinations, so no exploitable open redirect was demonstrated. Browser page errors also expose a timing-sensitive avatar hydration mismatch under fast synthetic auth responses. Details and separate product-fix proposals are in [the defect register](defects.md).

## Safety, ownership and preservation

The coordinator owns manifests, lockfile, shared configs, `scripts/qa/**`, `qa/**` and evidence. The frontend tester (native agent `backend_map`, reassigned for this phase) exclusively authored `tests/components/**`. The system tester (`qa_planner`) exclusively authored `tests/browser/**`. Reviewer `quality_operations` performed read-only independent review. At most three workers were active, with no overlapping writes. No custom roles, model changes or global settings were created.

Phase-start non-secret baselines recorded **234 FE files and 236 BE files**. FE branch/HEAD is `develop` / `a95174dffa8b41bd8650fd053178018dd03c18ad`; BE is `development` / `f3fdc7998a8b5e8bfc913cadf464f23eeb3332b7`, with prior local backend QA work. The specifically mentioned FE manifest, lock and tsconfig were clean at recheck; `AUDIT.md` was absent. The ten original FE WIP files and all BE baseline files remain preserved. Only approved FE manifest/lock entries changed among the FE baseline files. Root `tsconfig.json` remains unchanged; the QA config is additive. [Preservation evidence](evidence/preservation.json) records hashes, ignore checks and actual diff attribution.

No ignore edits were needed. Raw component results/coverage stay in `qa-raw/vitest-results/` and `qa-raw/vitest-coverage/`; browser logs, screenshots and traces stay in `qa-raw/playwright-results/` and `qa-raw/playwright-report/`. Agent notes, downloaded tools and preparation logs stay under `.qa-agent-work/`. Tests/configs/docs/selected evidence remain versionable. Ignore rules neither sanitize files nor define a submission ZIP. The selected JSON omits headers, cookies, tokens and request bodies; any retained screenshot is separately inspected. Raw traces are not selected submission evidence.

The [change inventory](evidence/change-inventory.json) attributes new files and approved edits to their owners. The selected [404 screenshot](evidence/contract-detail-404.chromium.png) was visually inspected; [its provenance record](evidence/selected-artifacts.json) records the source run and matching SHA-256. It shows only the generic error page and development indicator.

The runtime fence protects reviewed Node API paths and records successful loading/denied synthetic file probes in every participating Node process/thread. It confines writes through resolved paths, rejects sensitive-file reads and unowned network destinations, and permits only explicit test tool children. Browsers use fresh owned contexts/profiles, service workers disabled, a local deny proxy, strict context request/WebSocket routing and background-network restrictions. These are application/process safeguards, **not OS/native-process containment**. The missing stronger containment and database-provider identity remain blockers for real-system testing.

Owned services use allocated loopback ports and explicit readiness checks. Cleanup closes browser/server/socket resources and uses recorded owned PID trees only when necessary. Startup/signal failures cannot be labeled passes. One interrupted diagnostic run initially raced Windows handle release during stage removal; a separately recorded, ownership-verified cleanup removed it afterward. The failure record is retained rather than rewritten as a clean run.

## Proposed Phase 4 — approval required

Propose separate FE/BE validation jobs with pinned runtimes, one-shot test/typecheck/lint/build commands, explicit paired commit SHAs plus local-diff provenance, and sanitized artifact selection. Keep component, mocked-browser and real-system jobs separately named; a blocked integration prerequisite must not turn green through a skip. Add only approved workflow changes after reviewing artifact paths, retention, access and dependency-install policy. Product fixes and provisioning an isolated backend remain separate decisions.

Human peer review and UAT need named participants, scenarios, build IDs, findings and explicit acceptance records. Automated tests and this independent AI review do not establish human sign-off or deployment. No CI workflow, push or deployment was performed. Work stops before Phase 4 approval.
