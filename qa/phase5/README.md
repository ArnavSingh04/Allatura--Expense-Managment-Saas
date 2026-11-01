# Independent validation verdict — 1 November 2026

**Verdict: locally reproducible isolated checks, with material failures and blocked real-system validation. Not release approval or full completion.** This phase changed assessment files only. Product code, tests, assertions, configuration, workflows, credentials and the frozen Phase 4 export were not changed. No commit, push, hosted execution or deployment occurred.

Native independent AI reviewers inspected the actual final files: `quality_operations` ran the complete safe matrix; `independent_preservation` reviewed baseline/Git/export preservation; `independent_sensitivity` reviewed assertions and calibrated faults in disposable copies. None authored the changes they reviewed. The coordinator inspected actual diffs, source assertions, launcher/workflow behavior and raw reports, verified report hashes and source manifests, and prepared this assessment. These are **AI reviews**, not human peer review or UAT. At most three workers were active, with separate ignored output directories and no shared implementation writes.

## State and reproducible evidence

| Repository | Branch | HEAD |
|---|---|---|
| plutus-fe | develop | `a95174dffa8b41bd8650fd053178018dd03c18ad` |
| plutus-be | development | `f3fdc7998a8b5e8bfc913cadf464f23eeb3332b7` |

The tested working-state SHA-256 is **`71ea6375d25f34ca8cb6ddd758ebca98aeb59e6773c6b1e7217e44ac0515e0ab`**. It covers 289 FE and 245 BE tracked/versionable non-secret files, including pre-existing untracked WIP. [Canonical inventory](evidence/working-state-identity.canonical.json) defines the byte-level algorithm and exclusions. Phase 5 assessment output is deliberately outside this identifier to avoid a circular hash. The collector rehashed all 534 files after execution: no changes. No commit was created to obtain an identifier.

[Validation matrix](evidence/validation-matrix.json) contains all 25 outer commands, inner executable arguments, UTC start/end times, native exit codes, report hashes, staged-source bindings, counts, diagnostics and coverage. Argument order is preserved; `<WORKSPACE>` and `<OWNED_STAGE>` replace personal workspace/temporary roots. Exact raw captures are identified by path and hash. Outer shell/batch success is not treated as an application pass. Executions began at 09:57:45 UTC; each command's finish time is recorded. [Browser results](evidence/browser-results.json) retain each of the 39 outcomes and sanitized failure diagnostics. [Run audit](evidence/run-audit.json) records the old/current browser comparison, capture completeness and process cleanup. Raw logs, traces and screenshots remain ignored and are not copied into this assessment.

Installed runtime: Windows x64, Node **24.15.0**, npm **11.12.1**. FE: Next **16.2.1**, React/React DOM **19.2.4**, TypeScript **5.9.3**, ESLint **9.39.4**, matching Next ESLint config **16.2.1**. Pinned tests: Vitest/V8 coverage **3.2.6**, Vite **6.4.1**, React Testing Library **16.3.0**, DOM **10.4.1**, user-event **14.6.1**, jest-dom **6.9.1**, jsdom **26.1.0**, Playwright **1.58.2**. BE: Nest **11.1.18**, Jest **29.7.0**, ts-jest **29.4.9**, TypeScript **5.9.3**, Mongoose **8.23.0**. Recorded package engine and relevant peer ranges match this installation; the tools actually executed. This does not establish clean-install, container or hosted-run compatibility. No dependency installation or framework upgrade occurred in this review.

## Executed results and boundaries

Commands below use `node scripts/qa/run-isolated.cjs --layer <layer>` in the named repository unless stated otherwise. Exact executable paths and additional arguments are in the matrix. These are one-shot runs, not watch mode.

| Check | FE result / exit | BE result / exit |
|---|---|---|
| Full unit layer | 45/45 pass / 0 | 214 assertions pass, **1 suite fails compilation** / 1 |
| Focused QA units | Included in FE unit count | 106/106 pass / 0; subset of the 214 |
| Legacy/starter layer | `legacy-unit`: 6 pass, 8 fail / 1 | `starter`: 5/5 pass / 0; overlapping suite |
| Harness | 8 tests included in FE's 45 | 15/15 pass / 0 |
| Public HTTP contract | Not applicable | 4/4 pass / 0; narrow public controller only |
| Full typecheck | 5 diagnostics / 2 | 3 diagnostics / 2 |
| Focused QA typecheck | Pass / 0 | Pass / 0 |
| Configured non-mutating lint | 13 errors, 4 warnings / 1 | 58 errors, 0 warnings / 1 |
| Build | Fails preserved context mismatch / 1 | Nest build passes / 0 |
| Mocked browsers | 24 pass, 15 fail / 1 | Not applicable |
| Real-system gate, direct and CI wrapper | Both BLOCKED / 2 | Both BLOCKED / 2 |

`node scripts/qa/validate-ci.cjs` passed in both repositories. `node --test qa/ci/validation.test.cjs qa/ci/export.test.cjs` passed 15 FE checks; `node --test qa/ci/validation.test.cjs` passed 14 BE checks. They include negative policy/export controls, not product scenarios. The FE exporter ran in verify-only mode and verified 32 reviewed files; it did not rewrite or upload the export. No aggregate "unique tests" total is claimed across overlapping layers.

FE's 45 tests comprise 37 client/component checks and 8 guard checks. Accessible roles/labels, user events, validation, pending/duplicate-submit, error/recovery and payload assertions provide isolated UI evidence. Service/auth/navigation doubles stop at the component boundary. Supplier/expense callback assertions do not establish the parent list's visible updated state or reload persistence. Async route behavior is exercised through Next/Playwright, not unsupported async Server Component rendering in Vitest.

BE units execute real guard/service methods with model/provider doubles. Allowed and denied unit controls and tenant-filter assertions are useful but do not prove JWT verification, real model binding, tenant isolation or unchanged persisted state after a denied write. The public HTTP module excludes the authentication/role/plan/tenant/database stack. A malformed-token denial is not accepted as tenant-isolation evidence.

Coverage of configured source: FE statements/lines **12.60%** (1,797/14,255), branches **70.72%** (331/468), functions **53.26%** (147/276). BE statements **12.78%** (649/5,075), lines **12.74%** (583/4,576), branches **6.08%** (130/2,138), functions **6.68%** (46/688). These scopes and denominators differ; percentages are not comparable measures of complete product coverage. FE's scope excludes API routes, proxy and Auth0 configuration. Raw coverage remains ignored.

## Browser findings and remaining defects

The 13 scenarios ran once in each engine: Chromium **8 pass / 5 fail**, Firefox **11 / 2**, WebKit **5 / 8**. No skips, retries, interruptions or unexplained result classes occurred. All cases expected success; red regressions were retained. Next readiness required both an IPC message and HTTP readiness/guard proof. All 39 boundary attachments recorded zero unexpected traffic. The browser execution reports clean shutdown, Next exit 0, no traffic violations and removed staging. The separate process check found no matching task-owned processes; unrelated processes were not stopped.

This is an actual Next **development** route test with mocked identity/domain APIs. It does not establish a real backend endpoint, production build behavior, persisted mutation or server authorization. Its reload on the detail URL verifies the missing route, not mutation durability.

| ID | Current observation and impact | Reproduction / retained evidence |
|---|---|---|
| FE-ROUTE-01, High / P1 | Contract list link reaches a missing detail page; HTTP **404 instead of 200** in all three engines. Primary detail navigation is broken. | [Contract regression](../../tests/browser/contracts-navigation.mocked-browser.spec.ts), browser matrix; `--layer mocked-browser` |
| FE-REDIRECT-01, Medium / P2 | Login shim forwards slash/backslash external-form return destination instead of `/dashboard`, all three engines. Installed Auth0 has a separate origin check; an exploitable open redirect is **not established**. | [Return regression](../../tests/browser/auth-navigation.mocked-browser.spec.ts), browser matrix |
| FE-HYDRATE-01, Medium / P2 | Avatar server/client mismatch under fast synthetic auth. Nine hydration-only failed slots, plus two of the three 404 slots also report hydration. | Browser errors, [fixture](../browser/fixtures.ts), `--layer mocked-browser` |
| FE-WIP-01, High / P1 | Preserved OrganisationSwitcher expects context fields absent from current source. Full types and production build fail. | Matrix's five diagnostics; `--layer typecheck`, `--layer build` |
| FE-WIP-02, Medium / P1 | Eight preserved membership/organisation VM test expectations remain unmet. This is not live tenant-isolation proof. | `--layer legacy-unit`, 14 executed |
| QA-WIP-01 / QA-WIP-02, Medium / P1 | BE StatusGuard test passes 3 constructor arguments to a 2-argument constructor. Legacy fixture uses `findLast` outside root lib and an implicit-any callback. Full unit/types remain red. | BE `--layer unit`, `--layer typecheck` |
| FE-LINT-01 / BE-LINT-01, Medium / P2 | Meaningful configured lint executes and fails with counts above. These are baseline findings, not that many newly introduced regressions. | Both `--layer lint`; exact rules/counts in matrix |
| BE-STORAGE-01, High if durability is required / P1 | Source/unit evidence allows metadata completion and stub storage without verification of durable object bytes. No live data loss was demonstrated. | [Document tests](../../../plutus-be/src/document/document.service.qa.spec.ts), [existing register](../phase4/defect-register.md) |
| IV-FIXTURE-01, High readiness risk / P1 before enabling DB tests | Preserved legacy fixture checks default connection host/name once, then `reset()` performs collection-wide deletion without renewed actual per-model connection/owned instance/port/database verification. Dormant: never executed here. | [Fixture lines 227–242](../../../plutus-be/test/support/isolated-app.ts); source inspection only |
| IV-CI-01, Medium gate-hardening gap / P2 | Actual Playwright config reports `forbidOnly: false`. No focused test exists now and all 39 slots ran, but a future `.only` could reduce the matrix without a mandatory rejection. | [Config](../../playwright.qa.config.ts), recorded resolved config in browser evidence |

Phase 4 had 20 browser passes/19 failures. The current 24/15 is **not a fix**: five hydration failures changed to passes (Chromium mobile/pending/rejected; Firefox deep-link/mobile), and Chromium deep-link changed from pass to hydration failure. The 174 participating source/fixture/config files are hash-identical. Newly passing cases have no page errors or unexpected traffic and used retry 0. Timing-sensitive hydration remains open.

FE-TOOL-01's earlier Firefox teardown failure did not recur; no fix or resolution is claimed. Ordinary safe `returnTo` handling still works within the mocked boundary; the reported ignored-return lead FE-LEAD-01 remains **not reproduced**, with the genuine issuer/callback journey blocked. The earlier CI-HARNESS-01 annotation correction remains supported by the passing BE build; nothing was repaired in this review. Historical defect evidence remains unchanged in the [Phase 4 register](../phase4/defect-register.md).

## Isolation, sensitivity and unresolved coverage

Real BE HTTP/security and FE-to-BE journeys are **BLOCKED**, including persisted mutation/reload, correct organisation/record verification, allowed/denied role and plan controls, cross-organisation access, and denied writes leaving the real database unchanged. The missing prerequisite is a pre-provisioned disposable runner with verified outbound containment for Node/native children, approved Mongo artifact and local synthetic external adapters, plus runtime proof of actual provider/model/resource ownership before any seed/reset/cleanup. No database was started, connected, seeded or reset. The current Node preload is a useful inspected fence, not OS/native containment. Prior user direction to keep integration blocked remains in force.

[Sensitivity evidence](evidence/sensitivity-review.json): unchanged baseline 28/28 passes; replacing rounding with floor causes 4 assertion failures, replacing forecast maximum with minimum causes 4, removing the variation tenant filter causes 1. Existing oracle/test bytes were unchanged. Each experiment used an explicit 14-file non-secret allowlist in a separate owned directory; all stages were removed and shared hashes remained identical. No runtime-error suite, skip or retry substituted for assertion failure. These calibrations are overlapping reruns, not additional coverage. No FE/browser or actual DB/security mutation experiment was performed; safe DB prerequisites are absent.

Financial expected values were independently reconciled from literal fixtures for cents, inclusive tax, approved/unapproved variations, actual costs, forecast and retention calculations. Refund/negative-half-cent policy and other unresolved acceptance rules remain questions. A tested formula is not approval of those rules. Full route/permission combinations, visible supplier/expense parent updates, durable storage bytes, real external integrations and comprehensive accessibility/UAT remain gaps.

The local FE build deliberately uses reviewed `next build --webpack`; the original default Turbopack production build path was not executed. Clean `npm ci` was not repeated. BE's extraneous local database test package is not declared in the lock, so a fresh installation may add a module-resolution failure to preserved WIP. Container Node 18 install / Node 20.10 build/runtime stages differ from local Node 24.15 and require separate review. No Docker image was built.

## Preservation, CI and export boundaries

[Preservation audit](evidence/preservation-review.json) records exact `git ls-files`, `git check-ignore -v`, `git status`, staged/unstaged deletion checks, original baseline hashes and current identities. Original 10 FE and 9 BE untracked WIP files are byte-identical. The original non-secret baseline showed FE manifest/lock/tsconfig **clean**, and `AUDIT.md` **absent**; the audit does not invent an earlier dirty change. Current approved manifest/lock changes preserve application ranges, original scripts/dev dependencies and all 904 original lock entries' versions/integrities/resolved locations; 196 entries were added. Root tsconfig remains unchanged; AUDIT remains absent. One original lock entry also gained license metadata.

Against the original 192-file FE baseline, only `.gitignore`, `package.json` and `package-lock.json` changed. Against the 211-file BE baseline, only `.gitignore`, `.dockerignore` and the narrow public-controller HTTP test changed. The inventory also lists every added versionable QA file and existing untracked WIP. Phase 5 adds only this README and reviewed `evidence/` files; reviewer/collector scratch lives under ignored `.qa-agent-work/`. No tracked file was removed or staged. Shared-file preservation matches approved ownership, but final hashes cannot reconstruct every historical write or prove individual writer identity.

Credentials were excluded from reads, copying, hashing and comparison in this validation. The safe stage manifests and guards support this phase's boundary. Present repository hashes cannot independently prove a historical "never read/copied/modified" claim for excluded credentials; no OS access-audit trail was available. This limitation is not converted into a pass.

The existing FE mirror workflow is byte-identical (SHA-256 `da41f8eef953d9b252cf35ec084ef6f6b95176b66db7b2554a951018fb25dccf`) and was not invoked. New QA workflows are manual-only, pinned-action, read-only permission jobs with separate full checks and a hard-failing real-system prerequisite. Child failures propagate; local negative policy tests reject omission, swallowed exits, mutable actions, credential persistence and raw uploads. No artifact-upload/deployment step was added. Local syntax/policy checks are not hosted GitHub execution; `actionlint` is unavailable. Clean preparation and hosted gates remain unrun. CI is intentionally not all green while prerequisites and checks fail.

Exact additional Git-ignore boundaries: FE `.gitignore` lines 39–43 cover `/.qa-agent-work/`, `/qa-raw/vitest-coverage/`, `/qa-raw/vitest-results/`, `/qa-raw/playwright-report/`, `/qa-raw/playwright-results/`; BE lines 34–36 cover `/.qa-agent-work/`, `/qa-raw/jest-coverage/`, `/qa-raw/jest-results/`. No local role-definition files were created. No tracked agent/raw files were removed or silently untracked. All 52 FE and 35 BE prior QA deliverable paths remain versionable; negative probes for tests/docs/fixtures/workflows/AGENTS and unrelated `.codex` content are not hidden. New Phase 5 files are checked separately in the final assessment audit.

Git ignore is **not sanitization or a ZIP filter**. The frozen [32-file export allowlist](../phase4/export-allowlist.json) and existing local export still match exactly (32 reviewed files plus MANIFEST, no extras). This assessment is **not added to that export**, and no ZIP/upload was created. Raw logs can contain hard-coded destination addresses and synthetic request details; they remain excluded. New evidence retains reviewed metadata, path/hash inventories and sanitized assertion excerpts only, with personal paths/address strings removed. Screenshots/traces were not copied into Phase 5 evidence. The [final assessment audit](evidence/assessment-audit.json) records versionability, content screening and a fresh 534-file source recheck. Its metadata correction concerns a path in this newly authored report, not a repair to evidence from a prior phase.

## Assessment inventory and next approval

| Assessment area | Actual artifact / status |
|---|---|
| Testing strategy and requirements | [FE requirements](../requirements.md), [BE requirements](../../../plutus-be/qa/requirements.md), [risk matrix](../phase4/requirement-risk-matrix.md); historical planned scope, with current gaps above |
| Executed automated testing | [25-command matrix](evidence/validation-matrix.json), [39 browser slots](evidence/browser-results.json), [mutation calibration](evidence/sensitivity-review.json); raw source reports referenced by hashes |
| Independent AI review | This verdict, preservation evidence, actual reviewer runs and fault experiments; not human sign-off |
| Real human peer review / UAT | **MISSING**; [human validation record](../phase4/human-validation.md) remains blank/pending |
| CI implementation | FE/BE `.github/workflows/qa.yml`, executed local policy tests; **hosted CI unrun** |
| Automated deployment / rollback | **MISSING**; [deployment design](../phase4/service-and-deployment-design.md) is a proposal, not execution proof |
| Defect tracking | Existing [cross-repo register](../phase4/defect-register.md), current reproduction table above, two new review observations IV-FIXTURE-01 / IV-CI-01 |
| Preservation / submission evidence | [Canonical identity](evidence/working-state-identity.canonical.json), [preservation review](evidence/preservation-review.json), frozen Phase 4 allowlist; no new export |

**Smallest proposed next scope:** separately approve setting Playwright's `forbidOnly` gate and proving its rejection with a disposable test-local negative control, without changing expectations or product behavior. The independent-validation instruction expressly prohibits making this correction now. A separate fixture-safety scope would add per-operation actual provider/model/instance/owned-resource verification before any destructive reset, with gates kept closed until the contained runner exists. Product/WIP/financial-policy changes require their own decision and approval. No further phase begins from this verdict.
