# Cross-repository defect and blocker register

Snapshot: 1 November 2026. This register consolidates established Phase 2/3 issues and separately labels Phase 4 checks in [local-matrix.json](evidence/local-matrix.json). Earlier run counts remain historical; the Phase 4 browser rerun executed 39 slots with 20 passed/19 failed and retained the same hydration, contract-route and shim-validation defects. A local workflow check is not a hosted CI execution or deployment.

IDs from the [frontend register](../defects.md) and [backend register](../../../plutus-be/qa/defects.md) are retained. Severity describes the observed impact within the stated boundary. Priority is proposed QA triage: P1 before accepting the affected release capability, P2 planned correction or decision, P3 investigation/monitoring. These are not release-owner acceptance decisions or security severity claims unsupported by server evidence.

Commands are reproduction instructions, not commands executed while writing this document. Run them from the named repository using the reviewed isolated launchers and prepared toolchain. Do not substitute an application startup, legacy full-application E2E command, hosted service, seed, or reset. Browser fixtures replace auth/domain APIs; backend units replace models/providers. Neither proves server-side authorization or persisted state.

Product fixes are **not approved**. Phase 4 authorizes QA/CI/evidence preparation; it does not approve deployment, financial policy, membership reconciliation, or external-provider testing. Human acceptance remains pending in [human-validation.md](human-validation.md).

## Confirmed frontend behavior and tooling failures

### FE-ROUTE-01 — contract detail link reaches a missing route

- **Status / severity / priority:** Open, reproduced mocked-browser functional defect; High functional impact / P1 because a displayed contract cannot be opened through its primary link.
- **Affected:** [Contract list](../../src/app/dashboard/projects/[id]/contracts/page.tsx); `/dashboard/projects/650000000000000000000001/contracts/650000000000000000000002`. The intended detail page is absent from the inspected route tree.
- **Expected versus actual:** A displayed reference should navigate to a successful detail response containing that contract. Actual Next navigation/reload returns 404. The test still expects HTTP 200 and the reference; no fixture page replaces the missing product route.
- **Minimal reproduction:** In `plutus-fe`, run `node scripts/qa/run-isolated.cjs --layer mocked-browser --project chromium`. The scenario opens the synthetic owner's contract list, focuses and activates the reference, then reloads the resulting detail URL and asserts its status/content.
- **Impact / evidence:** Blocks contract-detail navigation. [Regression](../../tests/browser/contracts-navigation.mocked-browser.spec.ts), [Phase 3 results](../evidence/frontend-phase-summary.json), [selected screenshot](../evidence/contract-detail-404.chromium.png). Phase 3 recorded this failure in all three engines; live backend detail access remains untested.
- **Proposed fix / approval:** Define and implement the intended detail route/data contract, or correct the displayed link if a different destination is intended. Product decision and implementation are not approved; preserve the failing assertion until separately resolved.

### FE-REDIRECT-01 — login shim forwards a backslash-form destination

- **Status / severity / priority:** Open, reproduced login-shim validation mismatch; Medium boundary-consistency impact / P2. This is not a demonstrated exploitable open redirect.
- **Affected:** [Login shim](../../src/app/login/page.tsx), `/login?returnTo=...`; the backslash-normalized external-form input in the regression.
- **Expected versus actual:** The documented same-origin-relative policy should reject the unsafe form and forward `/dashboard`. The shim instead forwards the slash/backslash input to `/auth/login`. The installed Auth0 SDK separately canonicalizes URLs and rejects a differing origin through `toSafeRedirect`; hosted callbacks were not tested.
- **Minimal reproduction:** In `plutus-fe`, run `node scripts/qa/run-isolated.cjs --layer mocked-browser --project chromium`. The `backslash-normalized external URL` case inspects the value forwarded by the product before the fixture's own redirect guard.
- **Impact / evidence:** A boundary accepts a form its policy says to reject; downstream SDK defense limits the demonstrated outcome. [Regression and ordinary-safe controls](../../tests/browser/auth-navigation.mocked-browser.spec.ts), [Phase 3 results](../evidence/frontend-phase-summary.json). Keep this separate from FE-LEAD-01.
- **Proposed fix / approval:** Review canonical URL validation at the shim while retaining safe paths/queries and fallback behavior. Product fix is not approved; actual issuer/callback integration needs the separately approved isolated environment.

### FE-HYDRATE-01 — avatar differs between server and first client render

- **Status / severity / priority:** Open, reproduced under mocked browser/auth timing; Medium / P2 because React reports a hydration error during normal dashboard entry.
- **Affected:** [DashboardTopbar](../../src/app/components/dashboard/DashboardTopbar.tsx), [AuthSessionContext](../../src/app/contexts/AuthSessionContext.tsx), dashboard routes.
- **Expected versus actual:** Initial server/client markup should agree and navigation should produce no page errors. React reports server avatar `?` versus client `QU` with fast synthetic identity/profile responses. Some functional assertions complete before the page-error assertion fails. Production/real-auth reproduction is unverified.
- **Minimal reproduction:** In `plutus-fe`, run `node scripts/qa/run-isolated.cjs --layer mocked-browser`. Retain cold navigation, current fixture responses and page-error collection; the observed distribution is browser/timing-sensitive.
- **Impact / evidence:** Unstable initial rendering and failed browser acceptance. [Browser fixture/error boundary](../browser/fixtures.ts), [Phase 3 results](../evidence/frontend-phase-summary.json). Historical matrix had eight hydration-only failed slots; two additional route-404 slots also reported hydration, not two additional failures.
- **Proposed fix / approval:** Review consistent initial avatar/session rendering, then retest cold entry across engines. Product fix is not approved. Delays, automatic retries and suppressing hydration/page errors are not accepted repairs.

### FE-TOOL-01 — Firefox context teardown protocol error

- **Status / severity / priority:** Open tooling failure, not an application role-denial finding; Medium validation impact / P2 because the executed browser case remains failed.
- **Affected:** Pinned Firefox/Playwright browser context cleanup; `a viewer can read the contract list without a creation control` in [contract navigation](../../tests/browser/contracts-navigation.mocked-browser.spec.ts).
- **Expected versus actual:** A completed case should close its context without protocol failure. Phase 3 reported `browserContext.close: Protocol error (Browser.removeBrowserContext)` with `_maybeDontRestoreTabs` / missing window session state. Offline trace inspection confirmed heading, link, hidden-create and boundary assertions passed before teardown.
- **Minimal reproduction:** In `plutus-fe`, run `node scripts/qa/run-isolated.cjs --layer mocked-browser --project firefox`; retain cleanup errors and the full case result. Recurrence is not guaranteed, and a later pass does not erase the historical failure.
- **Impact / evidence:** Red tooling outcome limits the completed browser matrix. [Phase 3 results](../evidence/frontend-phase-summary.json), [final process check](../evidence/final-process-check.json). Owned server exit was 0, stage removal completed and no matching live task processes were found afterward.
- **Proposed fix / approval:** Record a targeted teardown diagnostic and review pinned browser compatibility. No framework upgrade or product fix is approved. Do not swallow cleanup failures or retry until green.

## Preserved source and quality-gate blockers

### FE-WIP-01 — organisation switcher disagrees with session context

- **Status / severity / priority:** Open, preserved WIP; High release-gate impact / P1 because full TypeScript and production build fail.
- **Affected:** [OrganisationSwitcher.tsx](../../src/app/components/dashboard/OrganisationSwitcher.tsx), [AuthSessionContext.tsx](../../src/app/contexts/AuthSessionContext.tsx).
- **Expected versus actual:** Component fields must agree with the current context contract. Historical full TypeScript reports five diagnostics: missing `organisations`/`organisationId` members and resulting inferred-type failures; build stops on that mismatch after compilation.
- **Minimal reproduction:** In `plutus-fe`, run `node scripts/qa/run-isolated.cjs --layer typecheck`, then separately `node scripts/qa/run-isolated.cjs --layer build`.
- **Impact / evidence:** Current production artifact is not validated as buildable. [Phase 3 diagnostics](../evidence/frontend-phase-summary.json); focused QA TypeScript passes but is not a substitute for the failed root check.
- **Proposed fix / approval:** Feature owner reconciles multi-organisation behavior and context types as a separate change. Not approved; original WIP and root compiler checks remain intact.

### FE-WIP-02 — legacy membership expectations remain unwired

- **Status / severity / priority:** Open, preserved legacy-unit failures; Medium functional/validation impact / P1 for accepting the membership feature.
- **Affected:** [scripts/workspaces.test.cjs](../../scripts/workspaces.test.cjs) and the membership/proxy/onboarding expectations it exercises.
- **Expected versus actual:** Existing cases describe the intended membership behavior. Historical execution gives 6 passing and 8 failing cases out of 14 against current implementation. These are VM/transpile mocks, not observed live cross-tenant access.
- **Minimal reproduction:** In `plutus-fe`, run `node scripts/qa/run-isolated.cjs --layer legacy-unit`.
- **Impact / evidence:** Existing feature expectations are unmet or unresolved. [Phase 3 results](../evidence/frontend-phase-summary.json), preserved script assertions. No passing security claim follows from either those mocks or UI role controls.
- **Proposed fix / approval:** Feature owner decides and reconciles the intended membership/proxy/onboarding contract, then runs unchanged expectations and real isolated controls. Product/WIP changes are not approved.

### FE-LINT-01 — established frontend lint baseline is red

- **Status / severity / priority:** Open lint debt; Medium maintainability/validation impact / P2. A finding's individual runtime severity requires separate assessment.
- **Affected:** Product/WIP source under [eslint.config.mjs](../../eslint.config.mjs), including render/effect purity, unescaped text, explicit `any`, unused symbols and the VM WIP script.
- **Expected versus actual:** The configured non-mutating gate should have no errors. Phase 3 recorded 13 errors and 4 warnings; no findings were in newly authored QA/test files. Phase 4 counts must come from its own matrix.
- **Minimal reproduction:** In `plutus-fe`, run `node scripts/qa/run-isolated.cjs --layer lint`.
- **Impact / evidence:** The configured quality gate fails. [Phase 3 diagnostics](../evidence/frontend-phase-summary.json), [Phase 4 local results](evidence/local-matrix.json).
- **Proposed fix / approval:** Review individual source/WIP findings in an approved correction scope. Configuration/QA preparation is approved; product fixes, autofix and broad rule suppression are not.

### QA-WIP-01 — backend guard test uses a different constructor contract

- **Status / severity / priority:** Open, preserved WIP compile blocker; High validation impact / P1 for accepting the complete backend unit gate.
- **Affected:** [status.guard.spec.ts](../../../plutus-be/src/auth/status.guard.spec.ts), constructor call around line 23; [StatusGuard](../../../plutus-be/src/auth/status.guard.ts).
- **Expected versus actual:** The intended test dependency contract must match the actual guard. WIP passes three arguments while the current constructor takes two. Historical full unit execution fails compilation of this suite while 214 other cases pass; root TypeScript also reports TS2554.
- **Minimal reproduction:** In `plutus-be`, run `node scripts/qa/run-isolated.cjs --layer unit` and, separately, `node scripts/qa/run-isolated.cjs --layer typecheck`.
- **Impact / evidence:** Full suite is FAIL, not a 214-test green run. [Backend results](../../../plutus-be/qa/evidence/backend-phase-summary.json). The 106 new QA cases are included in the 214; do not add the counts.
- **Proposed fix / approval:** Membership WIP owner reconciles the extra dependency's intended behavior rather than deleting the requirement to make the test compile. Product/WIP fix is not approved.

### QA-WIP-02 — backend WIP helper exceeds root TypeScript library/dependency scope

- **Status / severity / priority:** Open root-typecheck blocker; Medium validation impact / P1 for accepting the full check.
- **Affected:** [test/support/isolated-app.ts](../../../plutus-be/test/support/isolated-app.ts), `findLast` around line 130 and callback around line 131; [root tsconfig](../../../plutus-be/tsconfig.json).
- **Expected versus actual:** Included WIP must typecheck against the declared compiler library and dependencies. Historical root diagnostics are TS2550 for `findLast` and TS7006 for its callback, in addition to QA-WIP-01. The helper also imports `mongodb-memory-server`, present extraneously locally but absent from manifest/lock; an additional clean-install missing-module failure is a source-detected risk, not a reproduced result here.
- **Minimal reproduction:** In `plutus-be`, run `node scripts/qa/run-isolated.cjs --layer typecheck`. A fresh declared-dependency CI run must record its own diagnostics; do not start the WIP database helper.
- **Impact / evidence:** Root TypeScript cannot be replaced by the passing focused config. [Backend diagnostics](../../../plutus-be/qa/evidence/backend-phase-summary.json), [QA config](../../../plutus-be/test/tsconfig.qa.json), [Phase 4 local results](evidence/local-matrix.json).
- **Proposed fix / approval:** Review WIP library/callback compatibility and declared dependency needs without adopting or executing a database package implicitly. WIP/dependency reconciliation is not approved.

### BE-LINT-01 — newly configured backend lint baseline fails

- **Status / severity / priority:** OPEN; Phase 4 configured lint exits 1 with 58 errors and zero warnings in [local-matrix.json](evidence/local-matrix.json). Medium validation impact / P2. These are newly surfaced baseline findings, including prior harness cleanup-rule findings, not 58 newly introduced code regressions.
- **Affected:** New backend [eslint.config.mjs](../../../plutus-be/eslint.config.mjs) and `scripts/qa/run-isolated.cjs` lint layer added by the coordinator; current source and preserved WIP in that reviewed scope.
- **Expected versus actual:** A genuine configuration must run non-mutating rules and retain findings. Phase 2 had no configured lint gate; the old package script used `--fix`. Phase 4's actual configured run fails with 58 errors and zero warnings, without modifying source.
- **Minimal reproduction:** In `plutus-be`, run `node scripts/qa/run-isolated.cjs --layer lint`. Use the new isolated layer; do not fall back to the old mutating command.
- **Impact / evidence:** Backend lint could not previously support a quality claim. The Phase 4 matrix records the command, actual failure, counts and per-file rule findings; configuration presence alone is not a pass.
- **Proposed fix / approval:** Adding a genuine non-mutating QA gate is approved. Triage its baseline without blanket suppression; product/WIP corrections and autofix are not approved. Update status from evidence without retroactively claiming Phase 2 lint ran.

## Storage, integration and policy gaps

### BE-STORAGE-01 — document completion is metadata, not verified durable bytes

- **Status / severity / priority:** Observed product/acceptance gap; High if durable document storage is required / P1 for accepting that capability. No live data loss was demonstrated.
- **Affected:** [DocumentService](../../../plutus-be/src/document/document.service.ts), stub responses around lines 117/171 and `finaliseUpload` around lines 125–148; [StorageService](../../../plutus-be/src/storage/storage.service.ts).
- **Expected versus actual:** Durable-upload acceptance would require object existence/content verification and successful retrieval of the uploaded bytes. Current document flow can return `stub://` when storage is unconfigured, and finalization sets uploaded/checksum metadata without checking object bytes. Configured signing is doubled in the unit tests. The import `uploadBuffer` local-file fallback is a separate path and does not prove document signed-upload durability.
- **Minimal reproduction:** In `plutus-be`, run `node scripts/qa/run-isolated.cjs --layer qa-unit`; inspect the document cases `creates unuploaded ... explicit stub URL` and `finalises metadata ... without ... proof of stored bytes`. This reproduces metadata/stub behavior, not cloud persistence.
- **Impact / evidence:** An uploaded flag/checksum is insufficient evidence that a retrievable object exists. [22 document unit cases](../../../plutus-be/src/document/document.service.qa.spec.ts), [BE-DOC-01 map](../../../plutus-be/qa/requirements.md), [backend results](../../../plutus-be/qa/evidence/backend-phase-summary.json).
- **Proposed fix / approval:** Confirm the durability contract and separately approve object verification/configuration behavior. Future isolated acceptance must upload known bytes, retrieve and compare length/hash, reject missing/truncated objects, prove tenant denial and clean owned objects. Product and external-storage work are not approved.

### QA-ISOLATION-01 — backend database/security integration prerequisite unmet

- **Status / severity / priority:** BLOCKED by missing proven native-process containment and explicit user decision; High assurance gap / P1 before persistence/security acceptance. This is not a discovered authorization bypass.
- **Affected:** [Backend HTTP gate](../../../plutus-be/scripts/qa/run-isolated.cjs), preserved [construction E2E](../../../plutus-be/test/construction.e2e-spec.ts) and [membership E2E](../../../plutus-be/test/membership.e2e-spec.ts).
- **Expected versus actual:** Real integration needs an approved disposable runtime with verified outbound containment and the actual injected model/provider bound to the intended owned database. No such target was proved. The gate exits 2/BLOCKED before staging, connection or seed; downstream database integration is not implemented by that gate.
- **Minimal reproduction:** In `plutus-be`, run `node scripts/qa/run-isolated.cjs --layer http`. The correct present outcome is a blocked prerequisite, not a green skip.
- **Impact / evidence:** JWT signature/issuer/audience/expiry/JWKS, real guard ordering, persisted role/plan/tenant denial, financial writes/deletes/concurrency and durable storage remain unproved. [Isolation evidence](../../../plutus-be/qa/evidence/isolation-status.json), [remaining risks](requirement-risk-matrix.md).
- **Proposed fix / approval:** Later provision the approved isolated runner/binary, prove provider identity before writes, then exercise real allowed controls and before/after denied-write snapshots. Integration remains blocked at the user's direction; provisioning/execution is not approved in Phase 4.

### FE-STACK-01 — real paired frontend/backend system is untested

- **Status / severity / priority:** BLOCKED; High end-to-end assurance gap / P1 before accepting real-system behavior.
- **Affected:** [Frontend stack gate](../../scripts/qa/run-isolated.cjs), actual FE proxy/API/Nest/database workflows.
- **Expected versus actual:** Paired acceptance requires real FE-to-BE requests, reload after persisted mutations, server-enforced role/plan/tenant controls and real owned cleanup. Current browser suites substitute auth/API responses; the stack gate exits 2 before service setup or seeding.
- **Minimal reproduction:** In `plutus-fe`, run `node scripts/qa/run-isolated.cjs --layer stack`. It must report BLOCKED while QA-ISOLATION-01 is unmet.
- **Impact / evidence:** UI-hidden controls and mocked responses do not establish server authorization, proxy contract compatibility or persistence. [Frontend results](../evidence/frontend-phase-summary.json), [browser requirement boundaries](../requirements.md), [risk matrix](requirement-risk-matrix.md).
- **Proposed fix / approval:** After separate isolation approval, use two owned synthetic tenants with valid same-tenant controls and persisted denied-write checks. Real-system execution is not approved; this entry stays distinct from the passing public-controller contract.

### BE-RULE-01 — financial acceptance policy is incomplete

- **Status / severity / priority:** Unresolved requirement; Medium decision risk / P1 before accepting the affected money workflows. No financial defect is inferred from missing policy.
- **Affected:** [Money helpers/tests](../../../plutus-be/src/schema/common.qa.spec.ts), [project financial tests](../../../plutus-be/src/project/project-financials.qa.spec.ts), claim/payment/retention rules.
- **Expected versus actual:** The user authorized tests of documented behavior. Negative variance has a documented overrun meaning and is tested with literal expected cents. Refund eligibility, negative half-cent rounding, claim payments versus expense-based paid totals and retention release lack complete approved acceptance examples.
- **Minimal reproduction:** Review [financial oracle and remaining gaps](../../../plutus-be/qa/requirements.md); `node scripts/qa/run-isolated.cjs --layer qa-unit` in `plutus-be` verifies existing documented examples only. It cannot resolve policy.
- **Impact / evidence:** Inventing refund or rounding rules would create unsupported test/product requirements. Historical money/financial suites pass 16 and 12 cases respectively; database/concurrency behavior remains blocked separately.
- **Proposed fix / approval:** Product/finance owner supplies policy and representative accepted/rejected examples before new acceptance assertions or product changes. Refund policy remains explicitly unresolved; no decision is made by this register.

### FE-A11Y-OBS-01 — unnamed dialog close controls and limited explicit recovery

- **Status / severity / priority:** Source observation and coverage gap; Low-to-Medium potential usability impact / P2 pending acceptance decisions and targeted verification. Not a reproduced runtime regression.
- **Affected:** [SupplierDialog](../../src/app/components/construction/SupplierDialog.tsx), [ExpenseDialog](../../src/app/components/construction/ExpenseDialog.tsx), [suppliers page](../../src/app/dashboard/suppliers/page.tsx), [billing page](../../src/app/dashboard/settings/billing/page.tsx).
- **Expected versus actual:** Accessible naming for icon-only close controls and explicit error recovery need agreed acceptance criteria. Source close icons lack an accessible name; supplier-list and initial billing errors have no explicit retry control. Pending close/escape/backdrop behavior is not covered by existing cases.
- **Minimal reproduction:** Read those components' close-button/error branches. Existing `node scripts/qa/run-isolated.cjs --layer unit` in `plutus-fe` verifies its current cases only; it does not reproduce the untested pending-dismissal behavior or certify complete accessibility.
- **Impact / evidence:** Potential assistive-technology discoverability and recovery friction. [Supplier tests](../../tests/components/supplier-dialog.test.tsx), [expense tests](../../tests/components/expense-dialog.test.tsx), [supplier page tests](../../tests/components/suppliers-page.test.tsx), [billing tests](../../tests/components/billing-page.test.tsx), [Phase 3 register](../defects.md).
- **Proposed fix / approval:** Agree expected accessibility/recovery behavior and add focused named-control/error/pending-dismissal tests. Product changes are not approved; do not imply an existing failing accessibility assertion.

## Leads not reproduced and repaired QA harness

### FE-LEAD-01 — ordinary safe return destination was preserved

- **Status / severity / priority:** Reported lead not reproduced; Informational / P3 monitoring. No current product fix is justified by this lead.
- **Affected:** [Login shim](../../src/app/login/page.tsx) and protected dashboard navigation with ordinary internal `returnTo` paths/queries.
- **Expected versus actual:** Preserve the protected destination through sign-in and forward a safe internal query-bearing destination. Observed synthetic sign-in returns to that destination; direct `/login` forwarding preserves its safe path/query. This does not test real Auth0 callback behavior.
- **Minimal reproduction:** In `plutus-fe`, run `node scripts/qa/run-isolated.cjs --layer mocked-browser --project chromium`; inspect the safe-return and protected-deep-link scenarios, separately from page-error findings.
- **Impact / evidence:** No ignored-return defect was established. [Regression controls](../../tests/browser/auth-navigation.mocked-browser.spec.ts), [Phase 3 results](../evidence/frontend-phase-summary.json). The different backslash-form mismatch remains FE-REDIRECT-01.
- **Proposed fix / approval:** Retain the destination assertions and investigate new concrete evidence if supplied. No product fix approved or proposed for the non-reproduced ordinary-return lead.

### QA-BASELINE-01 — reported missing-DI failures were not current

- **Status / severity / priority:** Reported starter-suite lead not reproduced; Informational / P3 monitoring.
- **Affected:** Backend `src/app.controller.spec.ts`, `src/user/user.controller.spec.ts`, `src/user/user.service.spec.ts`.
- **Expected versus actual:** Starter testing modules should resolve their dependencies. Historical isolated execution passes all three suites and all five cases; the reported missing-provider failure did not reproduce in this worktree/toolchain.
- **Minimal reproduction:** In `plutus-be`, run `node scripts/qa/run-isolated.cjs --layer starter`.
- **Impact / evidence:** No provider/product repair is justified by this lead. [Backend execution summary](../../../plutus-be/qa/evidence/backend-phase-summary.json). This passing subset does not replace the full failing unit gate.
- **Proposed fix / approval:** Preserve the baseline and collect exact new diagnostics if the lead recurs. No product change approved or needed on present evidence.

### QA-HARNESS-01 — public HTTP test repaired and validated

- **Status / severity / priority:** Repaired, tested QA harness; prior Medium validation/safety impact / P2 resolved within its narrow scope.
- **Affected:** [Backend test/app.e2e-spec.ts](../../../plutus-be/test/app.e2e-spec.ts), public `GET /v1` and `GET /v1/health` contract.
- **Expected versus actual:** Current public metadata routes should be tested with a callable Supertest import and an isolated module. Original test used a non-callable namespace import, obsolete `Hello World!` expectation and full AppModule without proved database isolation. Repair uses default import, AppController/AppService only, owned loopback listener, exact current responses and root/unknown-route 404 cases.
- **Minimal reproduction:** In `plutus-be`, run `node scripts/qa/run-isolated.cjs --layer contract`, then `node scripts/qa/run-isolated.cjs --layer qa-typecheck`.
- **Impact / evidence:** Four public HTTP cases and focused TypeScript passed in Phase 2. [Regression](../../../plutus-be/test/app.e2e-spec.ts), [execution summary](../../../plutus-be/qa/evidence/backend-phase-summary.json). It deliberately does not prove protected HTTP, database or real security-stack behavior.
- **Proposed fix / approval:** Original harness repair was explicitly approved, implemented and tested. Retain it and its boundary statement; no product fix was made and full integration remains blocked.

### QA-HARNESS-02 — frontend preparation, boundary and locator corrections

- **Status / severity / priority:** Repaired QA tooling issues with retained failed attempts; prior Medium validation impact / P2 resolved for the recorded final matrix. This new ID groups the corrections already documented in the Phase 3 register.
- **Affected:** [Frontend launcher](../../scripts/qa/run-isolated.cjs), [QA harness](../harness), [browser fixtures](../browser/fixtures.ts), [accessible workflow cases](../../tests/browser/route-accessibility.mocked-browser.spec.ts).
- **Expected versus actual:** Tests need working isolated staging/preloads, owned browser/server traffic and locators matching actual accessible names. Earlier attempts hit placeholder metadata, Windows preload paths, Vitest loading/symlinks, Next worker preload formatting, owned HMR traffic, synthetic API/font setup and overly broad locators. Those harness issues were corrected without changing product routes/components or weakening destination/focus/no-write/page-error expectations.
- **Minimal reproduction:** In `plutus-fe`, run `node scripts/qa/run-isolated.cjs --layer unit`, `node scripts/qa/run-isolated.cjs --layer qa-typecheck` and separately `node scripts/qa/run-isolated.cjs --layer mocked-browser`. The final browser result is still expected to report unresolved product/tooling failures, not a repaired-harness green claim.
- **Impact / evidence:** Phase 3 had 37 component cases plus 8 probes passing; the final browser matrix executed 39 slots with 24 passing/15 failing, zero skips/retries. [Retained intermediate and final results](../evidence/frontend-phase-summary.json), [Phase 3 explanations](../frontend-testing.md). Interrupted-run cleanup evidence is retained separately rather than rewritten as success.
- **Proposed fix / approval:** QA harness corrections were within approved testing scope and validated by the coordinator. Future tooling changes need their own evidence; no product repair, swallowed cleanup failure or expected-failure override is authorized by this entry.

## Deployment and evidence limits

### CI-DEPLOY-01 — Docker runtimes differ from the validated QA runtime

- **Status / severity / priority:** Source-detected deployment mismatch, deployment unverified; Medium compatibility risk / P1 before deployment acceptance. No container build or deployment failure was reproduced here.
- **Affected:** [Backend Dockerfile](../../../plutus-be/Dockerfile), [.dockerignore](../../../plutus-be/.dockerignore), [Cloud Run notes](../../../plutus-be/GCP-CLOUD-RUN.md).
- **Expected versus actual:** Deployment should use a supported, deliberately validated runtime and documented artifact/configuration contract. Docker installs dependencies on Node 18, then builds/runs on Node 20.10; installed Nest 11 declares Node >=20, while local QA uses Node 24.15.0/npm 11.12.1. The deployment notes also contain older JWT/mock-billing assumptions. Source inspection does not establish the actual deployed revision/runtime.
- **Minimal reproduction:** Read `Dockerfile`, `.dockerignore` and non-secret package metadata in `plutus-be`; compare the `FROM` versions with Nest's engine metadata and recorded QA toolchain. Do not run Docker, gcloud, application startup or deployment as part of this reproduction.
- **Impact / evidence:** QA results cannot certify the different production image/runtime or identify the actual deployment target. The coordinator mitigated the separately observed QA-artifact context gap by adding exact `/.qa-agent-work`, `/qa-raw/jest-results` and `/qa-raw/jest-coverage` exclusions to `.dockerignore`, preserving prior lines; that gap is not reported as still open. [Backend toolchain evidence](../../../plutus-be/qa/backend-testing.md), [Phase 4 local results](evidence/local-matrix.json). Hosted CI, container compatibility and deployment remain unverified unless separately evidenced.
- **Proposed fix / approval:** Separately review runtime alignment, native dependency installation and deployment documentation, then validate an approved immutable artifact. Phase 4 quality-workflow/evidence preparation and the stated QA-context exclusions are approved. Further image/runtime or product changes and deployment execution are not approved by this register.

## Evidence interpretation

Phase 3's 39 browser slots represent 13 distinct scenarios across three engines, not 39 unique requirements. Its 37 component cases are separate from 8 harness probes. Backend's 106 QA unit cases are a subset of the 214 passing full-discovery cases. Never sum overlapping counts or treat a failed suite, blocked prerequisite, unimplemented integration runner or missing human review as passed.

The [risk matrix](requirement-risk-matrix.md) records covered and uncovered requirements; this register records issues and decisions. The [Phase 4 local matrix](evidence/local-matrix.json) records current executions, but only direct retest evidence can close a defect or remove a blocker. Human review/UAT, hosted CI and deployment require their own real records.

### CI-HARNESS-01 — lint configuration declaration inference repaired

- **Status / severity / priority:** RESOLVED within approved Phase 4 QA configuration scope; Medium build-validation impact / P1 during setup.
- **Affected:** Backend `eslint.config.mjs` and its inclusion in the staged Nest build.
- **Expected versus actual:** Adding lint should not break the existing build. The first Phase 4 Nest build reported TS2742 because its emitted declaration could not name the inferred default configuration type portably.
- **Minimal reproduction / regression:** `node scripts/qa/run-isolated.cjs --layer build` in `plutus-be`. The initial failed run is retained; run `2026-11-01T09-48-16-293Z-b3e50f23` passes after the fix.
- **Impact / evidence:** This was introduced by QA setup, not a pre-existing product build defect. Both attempts and hashes are in [local-matrix.json](evidence/local-matrix.json).
- **Fix / approval:** Explicit `import('eslint').Linter.Config[]` JSDoc annotation in the new config; authorized local configuration repair, implemented and retested. No product edits or broad compiler exclusions.
