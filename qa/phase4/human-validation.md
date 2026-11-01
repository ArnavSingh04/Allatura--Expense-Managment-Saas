# Human peer review and acceptance workbook

Prepared on 1 November 2026. **Human review and human UAT are PENDING.** No person has supplied a review, acceptance result or sign-off for this record. The existing [frontend AI review](../review-record.md) and [backend AI review](../../../plutus-be/qa/review-record.md) are explicitly AI reviews. Automated browser execution is not human acceptance testing.

This workbook is a script and blank record, not authority to start an uncontained application, use live credentials, send invitations, charge a card, deploy or contact an external provider. The [requirement/risk matrix](requirement-risk-matrix.md) records the current automated evidence and gaps. Phase 2/3 reports are historical execution evidence; preparing Phase 4 documents does not rerun those checks.

## Peer-review record

| Field | Human entry |
|---|---|
| Status | PENDING |
| Reviewer name and role | |
| Independence from implementation / relationship to authors | |
| Review date and timezone | |
| FE commit plus local-diff/source-manifest identifier reviewed | |
| BE commit plus local-diff/source-manifest identifier reviewed | |
| Evidence/run IDs reviewed | |
| Review scope and exclusions | |
| Decision and rationale | |
| Follow-up owner and due date | |

Leave each box unchecked until a human has inspected the cited material. An unchecked item is not approval; an accepted limitation needs a recorded rationale and owner.

- [ ] Match the actual reviewed FE/BE source, lockfiles and local diff to evidence identifiers. Preserve existing WIP and unrelated automation, including the mirror workflow; do not mistake a baseline commit for the tested local state.
- [ ] Inspect exact gates and commands, not just green summaries. Full typecheck, configured lint, full unit discovery and build failures must fail their jobs. Check for swallowed exits, `continue-on-error`, blanket success fallbacks, broadened ignores, unexpected retries or disabled assertions.
- [ ] Check the dependency/runtime pins and clean lockfile installation design. Distinguish a locally syntax-checked workflow from a completed hosted CI run; verify actual hosted URLs only if they later exist.
- [ ] Review fixture boundaries against [FE requirements](../requirements.md) and [BE requirements](../../../plutus-be/qa/requirements.md). Mocked profiles, API responses, model calls and signing adapters cannot prove real authentication, persistence, tenant separation or durable object bytes.
- [ ] Review allowed controls alongside rejected controls: owner/viewer UI behavior; active/pending/rejected status; plan tier/features; own/foreign tenant; valid/invalid identity. A malformed fixture that always returns 401 is not authorization evidence.
- [ ] Check literal financial oracles, currency and cents units, empty/update/delete/idempotent cases, and documented overrun balances. Do not approve refunds or negative half-cent rounding from those tests; resolve **BE-RULE-01** with a product/finance owner first.
- [ ] Reconcile import expectations with the current controller, strategies and tests. In particular, owner/PM import roles and variation import entitlement behavior need explicit acceptance criteria; a general feature guard unit test does not establish every import endpoint's policy.
- [ ] Read the stable [FE defect register](../defects.md) and [BE defect register](../../../plutus-be/qa/defects.md). Keep contract 404, login-shim forwarding, mocked hydration, browser cleanup, WIP/lint debt and storage durability separate. No product fix or verified resolution should be inferred from harness repairs.
- [ ] Confirm **FE-REDIRECT-01** is a login-shim validation mismatch, with later SDK same-origin protection observed statically. It is not a demonstrated exploitable open redirect. Confirm **FE-HYDRATE-01** was reproduced with fast synthetic profile replies, with real-production impact unverified.
- [ ] Verify the database/system gate remains blocked under **QA-ISOLATION-01 / FE-STACK-01**, before connection or seed. Review proposed provider identity, outbound containment, owned reset and cleanup evidence before any later real-stack execution. A Node preload is not native-process containment.
- [ ] Reconcile results without double counting: 106 new BE units are included in 214 passing full-suite tests; 37 FE component cases plus 8 harness probes make 45; 39 browser executions are 13 scenarios in 3 engines. Retain the Firefox teardown failure even though functional assertions finished.
- [ ] Inspect measured coverage scope/exclusions and uncovered risks. Do not invent a passing threshold or equate coverage with complete behavioral proof.
- [ ] Review explicit artifact export/upload allowlists and each selected artifact. Reject raw traces, headers, cookies, request bodies, environment dumps and unreviewed screenshots/logs. Ignore rules alone do not sanitize or authorize export.
- [ ] Check cleanup and evidence of owned-process termination. Treat cleanup failures as failures; do not kill unrelated processes or reset a target merely because its name looks like a test database.
- [ ] Confirm this workbook contains genuine human entries only. A release decision must identify remaining failed/blocked requirements, approved risk exceptions and owners. Human acceptance does not silently override a failed CI gate.
- [ ] Confirm remote CI evidence and actual deployment/rollback evidence are separate. Actual CD still needs explicit target, provider/project, trigger, credential mechanism, cost/side effects, smoke checks and rollback authorization.

| Feedback ID | Real reviewer / date | Finding and evidence | Requested change | Owner / disposition | Resulting change reference | Retest evidence / human verification |
|---|---|---|---|---|---|---|
| | | | | | | |
| | | | | | | |

## Human UAT prerequisites

Two scopes must remain visibly separate:

| Scope | Prerequisites and current readiness |
|---|---|
| M: mocked UI walkthrough | A reviewed, task-owned interactive Next/browser fixture session with explicit actor/error controls, synthetic configuration, no provider calls and retained cleanup ownership. The existing one-shot automated browser runner closes its server; it is not an interactive UAT launcher. An interactive setup is not implemented or approved by this workbook. Human execution is PENDING setup. Results can cover UI behavior only. |
| R: real FE/BE acceptance | A separately approved disposable FE/BE/database environment with proven native-process outbound containment, actual resolved DB/model identity, test-owned signing material, deterministic fixtures and reset, and no production fallback. Local email/payment/storage substitutes must be explicit. This scope remains BLOCKED under the prior isolation decision; no database has been started or seeded. |

For either scope, record the exact source/build, browser and viewport, mode M/R, fixture version, operator and human tester before starting. Do not substitute an arbitrary `npm run dev`, broad seed script or live login for the reviewed lifecycle. The current FE production build is failed, so a development walkthrough cannot be reported as production-build acceptance.

Use synthetic actors only: anonymous; active owner, PM, finance and viewer; pending and rejected users. Use two synthetic organisations (`qa-org-a` / `qa-org-b`) for R, never existing customer records. Existing browser IDs are project `650000000000000000000001`, contract `650000000000000000000002`, user `650000000000000000000011`; the visible reference is `QA-CONTRACT-001`. Existing component IDs are strings such as `qa-supplier-a` and are not ready-made database seeds. Future R fixtures must satisfy real schemas and references.

Before R mutations, the operator must show a positive same-tenant read/write, the exact owned database and model connection, and baseline snapshots for both organisations. Reset only task-owned data between scenarios; verify cleanup afterward. For denied writes, capture unchanged persisted state and a valid allowed control, not just a hidden button or an HTTP error. Store reviewed, sanitized observations rather than tokens or raw request captures.

## Representative acceptance scripts

All human outcomes below are blank. Known automated defects are background evidence, not a pre-filled human result. Use a fresh fixture state for each case. A blocked prerequisite is recorded as BLOCKED with a reason, never PASS.

| ID / scope / actor | Human steps | Expected outcome and basis | Current constraint |
|---|---|---|---|
| UAT-01 / M then R / anonymous to owner | Open the project's `/contracts?view=recent` deep link while signed out. Complete only the supplied synthetic sign-in in M. Inspect path/query and displayed contract after return. Separately open `/login` with safe internal query, absent destination, absolute URL, protocol-relative URL and backslash-form `/\qa.invalid/escape`, URL-encoded as the `returnTo` value. | Safe path/query preserved; missing or invalid destination falls back to `/dashboard` at the login shim; no unintended cross-origin destination. The [browser specification](../../tests/browser/auth-navigation.mocked-browser.spec.ts) captures the forwarded value before the fixture's own safety check. R must separately exercise an approved local identity flow; no live OAuth is authorized here. | FE-REDIRECT-01 remains red for backslash forwarding. Ordinary safe-return lead FE-LEAD-01 did not reproduce. SDK downstream protection means this shim check alone is not exploit proof. |
| UAT-02 / M then R / owner, viewer | Open the project contract list. Reach `QA-CONTRACT-001` by keyboard and press Enter; reload its destination. Repeat the list view as viewer. | The linked actual detail route responds successfully and displays the same contract; viewer can read the list and has no New contract action. See [contract route specification](../../tests/browser/contracts-navigation.mocked-browser.spec.ts). For R, additionally verify the server rejects a viewer create attempt while an owner create succeeds. | FE-ROUTE-01 currently returns 404. UI hiding alone is not server authorization. Firefox cleanup failure FE-TOOL-01 remains a separate tooling result. |
| UAT-03 / M / owner | Open the project's `/contracts/new`. Type a reference using the keyboard, Tab to Status, add a milestone with Enter, then submit with required details absent. | Status receives focus; a milestone named `Milestone 1` appears; the visible alert says `Reference, scope, department, subcontractor and value are required.`; the route remains and no create request occurs. Check error clarity with the human's assistive technology. [Existing assertion source](../../tests/browser/route-accessibility.mocked-browser.spec.ts). | Human usability/accessibility is unassessed; automated checks cover selected controls only. Hydration page errors remain failures. |
| UAT-04 / M / owner, pending, rejected | At 390 x 844, open navigation with Enter and dismiss with Escape. As pending and rejected actors, open the protected contract list. For owner, inject one account-API failure then restore it and activate Try again. | Drawer closes and focus returns to open navigation; pending sees `Waiting for approval`, rejected sees `Access denied`, with Sign out and no project list. Retry restores the same route and list. [Existing browser source](../../tests/browser/route-accessibility.mocked-browser.spec.ts). | FE-HYDRATE-01 may fail the page-error check even after content appears. Add real device/screen-reader details to the result; do not call this broad accessibility certification. |
| UAT-05 / M extended fixtures, then R / permitted supplier/expense actor | Open supplier create/edit. Leave name blank, correct it, save; inspect pending controls, a controlled rejection, retained input, retry and Cancel. Enter expense 123.45, then correct a rejected entry to 12.35. Reload after an R save. | Required input is identified; one intended submission; exact edited record is updated; cancellation makes no mutation; retry retains/corrects input; money payloads are 12345 and 1235 AUD cents. R reload must read the saved record. Basis: [supplier](../../tests/components/supplier-dialog.test.tsx) and [expense](../../tests/components/expense-dialog.test.tsx) components. | These routes are not in the current browser fixture matrix; fixture extension or R setup is required. Pending close/Escape/backdrop behavior and close-icon naming need a separate agreed outcome, FE-A11Y-OBS-01. No refund inference. |
| UAT-06 / R / owner, PM, finance, viewer and foreign owner | Using the approved role/endpoint matrix, perform a permitted own-organisation action. Attempt the corresponding disallowed role, foreign-record read/list/write and unavailable plan feature through the real API as well as the UI. Inspect both organisations before and after. | Stored server authority controls access; no foreign data or denied mutation; valid same-tenant action persists. Assert the endpoint's specified denial response and unchanged records. Resolve any unspecified visibility/assignment rules before declaring acceptance. Basis: [BE auth/status/plan units](../../../plutus-be/qa/requirements.md). | BLOCKED real-stack environment; signatures, expiry, issuer/audience, HTTP guard ordering, tenant interception and persisted denial are unproven. |
| UAT-07 / R / finance with approved permissions | Seed the reviewed financial oracle through the owned fixture procedure. Inspect project totals, change and delete an eligible synthetic expense, reload and recompute again. Separately exercise a documented overrun. | For the fixed oracle, AUD cents are revised budget 1010000, commitments 135000, invoiced 30000, paid 25000, retention 2250, forecast 135000, variance 875000. Repeated unchanged recomputation is stable; update/delete effects match separately recorded literal expectations. Documented 10000 minus 12350 overrun is -2350. [Oracle and limits](../../../plutus-be/qa/requirements.md). | BLOCKED persistence. BE-RULE-01: refund eligibility, negative half-cent rounding, claim-versus-expense paid totals and retention release require finance/product decisions; do not invent acceptance results for them. |
| UAT-08 / R / owner or PM | At `/dashboard/import`, use a synthetic supplier CSV containing one new valid row, one known existing duplicate and one missing required name. Review mapping, preview, and duplicate action `skip`; confirm; reload the supplier list. Re-import with an explicit approved update action. | Upload/preview does not create domain rows; required mapping errors are visible; duplicate is marked and defaults to skip; valid rows are created only on confirm, invalid rows are reported, and skipped rows remain unchanged. An approved update affects the intended record only. [Import service tests](../../../plutus-be/src/imports/services/import.service.spec.ts) and [controller roles](../../../plutus-be/src/imports/imports.controller.ts). | BLOCKED persistence; no current FE browser import coverage. Samples and service tests differ on variation entitlement descriptions, so settle that policy before adding variation-plan acceptance. Do not use personal emails or bulk demo seeds. |
| UAT-09 / R / permitted uploader and foreign actor | On project documents, upload known harmless bytes to the owned local storage substitute, finalise, download and compare byte length/hash. Attempt finalisation of missing/truncated content and foreign-tenant access. Delete only the created fixture data. | A durable-upload claim requires retrievable matching bytes, rejection of invalid content, tenant separation and verified cleanup. Metadata or `stub://` URLs do not satisfy it. [Document unit scope and BE-STORAGE-01](../../../plutus-be/qa/defects.md). | BLOCKED real storage path. Durable bytes are a proposed acceptance requirement awaiting owner confirmation; present source only proves metadata/stub behavior, not this outcome. |
| UAT-10 / M extended fixtures, then R / owner and restricted actor | Inspect Free/Pro/Enterprise billing states with synthetic plans. Start a locally stubbed upgrade, observe pending/error state, then exercise confirmation and cancellation of a subscription change. Verify an R plan-feature denial with a permitted control. | Actions and messages match the selected fixture; errors are visible; cancellation requires confirmation; refreshed local state is shown. [Billing component assertions](../../tests/components/billing-page.test.tsx) and [plan definitions](../../../plutus-be/src/billing/plans.config.ts). | No card details, live checkout, live webhook or payment. Current browser fixtures do not cover billing. Real entitlement persistence and provider behavior are unproven. |
| UAT-11 / R / inviter and invitee | With a local email sink and owned test token, create an invitation; accept using its matching synthetic identity. Repeat with mismatched identity, expired token and already consumed token. | The matching invite is consumed once and creates the intended user; mismatched/expired/used tokens are rejected without exposing organisation details. Inspect the local sink only. [Existing invitation unit tests](../../../plutus-be/src/invitation/invitation.service.spec.ts). | BLOCKED actual identity/database path. Existing invitation roles and current membership WIP need owner review before choosing accepted role assignments. No real email may be sent. |

For UAT-07, the fixture inputs are budget 1000000, approved variation 10000, contract current value 110000, loose committed expense 20000, loose invoiced expense 5000 and contract-linked paid expense 25000, all AUD cents. The independently specified totals are an oracle for that fixture, not universal financial policy.

## Blank execution and change records

Copy a row for every human attempt, including blocked attempts. Record observed behavior verbatim enough to compare with the expectation; never replace the expected result with the actual one to obtain a pass. Evidence links must point to deliberately reviewed, sanitized artifacts.

| UAT ID | Human tester / role | Date / timezone | FE/BE source/build and mode M/R | Fixture/reset ID; browser/device/assistive technology | Actual outcome | PASS / FAIL / BLOCKED; reason | Sanitized evidence / defect ID |
|---|---|---|---|---|---|---|---|
| UAT-01 | | | | | | PENDING | |
| UAT-02 | | | | | | PENDING | |
| UAT-03 | | | | | | PENDING | |
| UAT-04 | | | | | | PENDING | |
| UAT-05 | | | | | | PENDING | |
| UAT-06 | | | | | | PENDING | |
| UAT-07 | | | | | | PENDING | |
| UAT-08 | | | | | | PENDING | |
| UAT-09 | | | | | | PENDING | |
| UAT-10 | | | | | | PENDING | |
| UAT-11 | | | | | | PENDING | |

| Feedback / defect ID | Proposed change | Approver / approval date | Implemented change reference | Independent retest run / human result | Resolution verified by / date |
|---|---|---|---|---|---|
| | | | | | |
| | | | | | |

| Acceptance decision | Human entry |
|---|---|
| Status | PENDING |
| Decision maker / role / date | |
| Accepted scope and exact build/source | |
| Open failed/blocked requirements and explicit risk decisions | |
| Remaining conditions, owners and dates | |
| Cleanup verification reference | |

Acceptance in this workbook grants no remote CI trigger or deployment authority. Hosted CI and deployment/rollback remain separate evidence records and approvals.
