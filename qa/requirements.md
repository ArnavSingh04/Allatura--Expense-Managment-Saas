# Frontend requirement and fixture map

## Current verification addendum — 1 November 2026

The following updates supersede the initial phase's missing-route/blocked-stack status below. Earlier observations remain as a dated historical map. Refer to [the current run table](frontend-testing.md) for exact commands and evidence paths.

| ID | Current implementation and verification | Remaining boundary |
|---|---|---|
| FE-FORM-02 / FE-FORM-03 | Existing supplier/expense assertions pass; named close buttons, Cancel and Escape cannot dismiss a pending mutation; payload, no duplicate submission and correction/retry assertions remain | Component service doubles; no financial policy inference |
| FE-BROWSER-01 / FE-REDIRECT-01 | All six existing browser scenarios pass across three engines; ten unit cases independently cover safe path/query/fragment and invalid return paths | Synthetic sign-in; hosted callback untested |
| FE-BROWSER-02 / FE-ROUTE-01 | Implemented contract detail page loads the API record, supports reload, retry and project mismatch guard; three component cases plus the existing browser navigation assertions pass | Browser contract API fixture; real contract detail persistence/authorization not covered by supplier stack suite |
| FE-AUTH-02 | Three actual React-effect tests cover tab binding, denied organisation recovery, stale subject response rejection and authentication failure classification; 14 preserved legacy membership/proxy/invitation assertions pass | Legacy cases use VM/service doubles; not equivalent to server-security proof |
| FE-UPLOAD-01 | Four service tests cover stub URL rejection, failed byte upload, finalise failure and successful ordering; two component tests assert visible failure, no completion and retry using the same file | Storage is synthetic; no durable external object transfer established |
| FE-STACK-01 | Three Chromium cases run the real Next proxy, real Nest services and disposable Mongo: owner creates in UI and sees data after reload; reader valid read plus denied create/unchanged DB; foreign owner valid read plus denied foreign GET/PATCH and forged-org create/unchanged DB | Supplier path only; synthetic local JWT/session, no hosted Auth0; no real plan restriction or broad mutation matrix |
| FE-HYDRATE-01 | Full 39-slot browser matrix passes retained page-error assertions after consistent first-render changes | Development build and synthetic auth; not production hosted-auth evidence |
| FE-GATE-01 | Full types, lint, production build, unit and legacy suites pass | Local execution; no hosted CI/deployment claim |

The real stack dynamically creates two synthetic organisations and owner/reader actors in its owned database. It records tenant identity and before/after database state. Its bridge credentials are temporary and excluded from selected evidence. No user database, external identity account or provider is required. Unit67, legacy14, mocked-browser39 slots and real-stack3 are distinct layers; they must not be summed into a claimed unique requirement count.

Still unverified: supplier deletion and broader persisted workflows; plan enforcement through the browser; durable uploads/providers; initial list/billing retry affordances; full manual accessibility; stakeholder UAT; production authentication and deployment. Component line coverage remains 15.91%, so comprehensive frontend coverage is not established.

## Historical initial-phase map — retained

| ID | Layer / files | Observed assertions | Limits |
|---|---|---|---|
| FE-FORM-01 | Component: `contact-page.test.tsx`, 6 cases | Required name, email/message validation, exact trimmed payload, accessible form, visible success, pending duplicate prevention, rejection/retry retaining values | Service double; no email delivery |
| FE-FORM-02 | Component: `supplier-dialog.test.tsx`, 6 cases | Required name, create/edit ID and payload, blank optionals, pending controls, rejection/retry, cancel without mutation | No HTTP/database save |
| FE-FORM-03 | Component: `expense-dialog.test.tsx`, 4 cases | Required fields, independent cents oracles 123.45→12345 and 12.35→1235, exact project/department/default links, pending and correction after rejection | Synthetic rejection does not establish an amount/refund policy |
| FE-AUTH-01 | Component: `auth-gates.test.tsx`, 10 cases | Owner allowed/viewer denied through real RBAC, readiness, status/onboarding screens, account retry and reauthentication | UI controls only; no server authorization |
| FE-LIST-01 | Component: `suppliers-page.test.tsx`, 5 cases | Loading versus empty, actual returned cells, empty create action, API error, role controls, exact search key and replaced result | Real SWR with fresh cache; mocked fetcher; list error has no explicit retry |
| FE-PLAN-01 | Component: `billing-page.test.tsx`, 6 cases | Free/Pro/Enterprise actions, pending checkout, denied API feedback, confirm-before-cancel and visible refreshed state | No payment, real entitlement change, checkout/portal navigation or server role proof |
| FE-BROWSER-01 | `auth-navigation.mocked-browser.spec.ts`, 6 scenarios | Protected path/query through synthetic sign-in; safe, absent, absolute/protocol-relative/backslash return destinations | Real Next route; profile/login boundaries mocked; actual OAuth callback unrun |
| FE-BROWSER-02 | `contracts-navigation.mocked-browser.spec.ts`, 2 scenarios | Keyboard contract link→actual detail route→reload/status/content; viewer list without creation control | Actual missing route remains red; API fixture is not backend-contract evidence |
| FE-BROWSER-03 | `route-accessibility.mocked-browser.spec.ts`, 5 scenarios | Labels/focus/keyboard and validation without writes; mobile navigation; pending/rejected status; account error/retry preserves route | Real browser/dev route with synthetic API/auth responses |
| FE-SAFE-01 | `qa/harness/node-guard.test.ts`, 8 probes | Owned temp positive control, sensitive-path/junction/socket/DNS denial, shell/eval denial, recursive-copy denial | Exercised Node API safeguard, not an adversarial OS sandbox |
| FE-STACK-01 | `--layer stack` | Fail-closed precondition gate | BLOCKED: real mutation→reload→persisted organisation record, real denied role/plan/cross-tenant writes and unchanged persisted state |

Component fixtures use tenant `qa-org-a`, `qa-supplier-a`, `qa-project-a`, `qa-dept-a`, `qa-expense-a`, synthetic owner/finance actors, reserved `example.test` emails, AUD integer cents and explicit date `2030-01-15`. They retain actual React/MUI, child screens and RBAC. Relevant service modules, `useAuthSession`, navigation hooks and the SWR fetcher are mocked. Controlled promises model pending requests; no fixed sleeps or implementation snapshots are primary proof.

Browser fixtures reuse Phase 2 project/contract identifiers `650000000000000000000001` / `650000000000000000000002`, user `650000000000000000000011` and tenant `qa-org-a`; only in-memory fixture responses exist. Project name is `Synthetic test project`, reference `QA-CONTRACT-001`, and email `qa@example.test`. Anonymous, owner, viewer, pending and rejected identities are explicit per-test state. All domain API writes and unconfigured API routes fail the fixture; no fake detail page is created.

Real integration still requires two actual synthetic organisations, test-owned signing material, proven runtime Mongoose/model identity and deterministic owned cleanup. A positive same-organisation control must accompany each denial; response codes and persisted before/after state must both be asserted. Neither UI hiding nor a mock 403 meets that requirement.

Coverage gaps remain: supplier deletion, pending close/escape/backdrop behavior, direct list/billing retry, actual hosted login, production hydration, durable uploads, persisted core mutations, comprehensive server authorization, other screens/routes, human accessibility/UAT and deployment. Source observations of unnamed close icons are documented separately from demonstrated failing assertions. Repeated execution in three engines is matrix coverage of the same 13 scenarios, not 39 distinct requirements.
