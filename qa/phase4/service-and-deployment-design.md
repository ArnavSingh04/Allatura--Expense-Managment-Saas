# Service isolation and deployment design — not executable authority

## Currently executable boundaries

Component tests use controlled service/auth/navigation doubles. Mocked-browser tests create a task-owned Next development server, backend rejection endpoint and local browser proxy on allocated loopback ports. They wait for IPC and HTTP readiness, use synthetic profile/API fixtures, reject unexpected domain writes/traffic and close only owned children, contexts and sockets. [FE harness](../../qa/harness/run-browser.cjs) and [fixture map](../requirements.md) establish the exact boundary. They do not start Nest or Mongo and do not seed/reset persisted data.

The BE public-controller [HTTP test](../../../plutus-be/test/app.e2e-spec.ts) starts a narrow Nest testing module and an ephemeral loopback server, with real URI versioning but without the database, JWT/role/plan/tenant stack or schedulers. Its four cases prove public route semantics only. Node guards protect reviewed APIs; they are not OS/native-process containment. Direct gates `FE --layer stack` and `BE --layer http` exit 2 before setup. There is no flag, attestation string, fake URI or environment name that unlocks them.

Fixture ownership stays with the coordinator. Existing Phase 2/3 IDs are synthetic and reusable as a design reference, not a claim that production DTO/schema requirements already accept every fixture. No operational seed script or customer record is used. All earlier secret/environment exclusions remain in force.

## Future real-system runner: prerequisites before implementation/execution

1. Approve a disposable runner/OS isolation mechanism, exact Mongo image or binary digest, and local fake identity/payment/email/storage dependencies. Stage dependencies before disabling outbound traffic; demonstrate denied outbound traffic for Node and native children. Do not infer containment from the current Node preload.
2. Pin the paired FE/BE commits plus approved local-diff identifiers. Prepare a minimal synthetic configuration that cannot load ambient configuration files or fall back to production. Start only test-owned services; record owned PIDs/container IDs, port bindings and a per-run ownership marker.
3. Await explicit database readiness and inspect the actual resolved Mongoose provider, connection/instance/database identity and injected model binding. Compare them to the owned target. A variable name or connection-string prefix is insufficient. **No seed, migration, reset or cleanup write precedes this proof.**
4. Seed only owned synthetic organisations A/B, roles/plans/statuses and referenced records. Verify exact organisation/record IDs and state. Use test-owned signing material with local issuer/JWKS and deterministic validity windows. Keep the real auth/status/role/plan/tenant stack active; do not override all guards.
5. Start the actual BE application with reviewed production bootstrap semantics and fake outbound adapters. Await versioned health/readiness, then start a built FE with exact owned origin/API destination and await readiness. Do not equate a development page or listening socket with production-build health.
6. Execute protected deep-link/safe-return login; contract list-to-real-detail data; representative create/update then reload and persisted value; allowed/denied roles/plans; and cross-organisation reads/writes. Pair every denial with an allowed control and compare persisted before/after state. Include known contract-route and financial-policy requirements without weakening them.
7. Reset deterministic test-owned records between independent cases, after rechecking ownership/provider identity. Close services in reverse ownership order and verify termination. Drop only the verified owned database/container and retain sanitized identity/cleanup evidence. Any setup, test, signal or cleanup failure makes the job fail.

This is a design, not an implemented runner. Current real-system status remains BLOCKED. No DB target, image digest, external credential or successful reset is invented.

## Deployment inspection

The backend has a [Dockerfile](../../../plutus-be/Dockerfile) and [Cloud Run guide](../../../plutus-be/GCP-CLOUD-RUN.md); these are source instructions, not evidence of a deployed service or approved account. Docker stages use Node 18 for dependency installation and Node 20.10 for build/runtime; local QA uses Node 24.15 and installed Nest 11 declares Node >=20. Native dependencies copied across those stages require validation. The guide's older auth/mock-billing assumptions require reconciliation with current source before use. No guide command was executed.

The coordinator added exact agent/raw QA exclusions to [.dockerignore](../../../plutus-be/.dockerignore). Existing entries are preserved. No image build, push, Cloud Run query or deploy was performed. No FE deployment workflow/provider project was established. The FE mirror is not a deployment workflow. Runtime/target uncertainty is tracked as CI-DEPLOY-01 in the [defect register](defect-register.md).

## Non-operational CD plan and approval record

No CD YAML or live-trigger placeholder is installed. Before actual execution, obtain explicit approval for every field below. Blank fields mean PENDING, not defaults.

| Decision | Approved value / approver / date |
|---|---|
| Target environment and data classification | |
| Provider, account/project and region | |
| FE/BE immutable artifact/source identifiers | |
| Trigger and authorized operator | |
| Permitted credential mechanism and least-privilege scope | |
| Build/deploy resource limits, estimated costs and side effects | |
| Migration compatibility and permitted data changes | |
| Health, authentication, routing and persistence smoke checks | |
| Rollback artifact/revision, trigger conditions and owner | |
| Rollback data-recovery scope, downtime and verification | |
| Evidence retention/access and approved upload allowlist | |

After approval and prerequisite fixes, the proposed sequence is clean locked validation → reproducible artifact build → independently reviewed deployment plan → explicit environment authorization → deploy → smoke checks → acceptance or approved rollback → verified observations and identifiers. Do not execute it with the present red gates or absent authority. Deployment and rollback evidence must come from actual observations; prepared YAML or local tests cannot satisfy the full automated testing-and-deployment criterion.
