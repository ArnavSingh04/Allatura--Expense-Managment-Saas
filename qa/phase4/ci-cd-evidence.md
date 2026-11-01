# CI/CD evidence record

| Evidence category | Actual status and reference | Missing evidence |
|---|---|---|
| Local command matrix | Executed; [native exits/counts/run hashes](evidence/local-matrix.json) include failures and blockers | Fresh locked BE install and a verified real-system environment |
| Workflow syntax/policy | Local js-yaml parse and exact reviewed-shape checks passed for both additive workflows; 14 policy tests passed per repository | actionlint was not installed; GitHub's hosted validator/action execution is NOT RUN |
| Export safety | One FE test exercises valid selection and stale/missing/duplicate/case-collision/traversal/junction rejection | This is supplemental checking, not automatic sanitization |
| Independent AI review | [Review record](review-record.md); source/assertion/evidence review only | Does not supply a human reviewer identity or approval |
| Hosted CI | NOT RUN; no run URL, run ID or status is asserted | Approved repository/ref, manual dispatch, runner/cost/dependency retrieval and resulting verified job records |
| Human peer review | PENDING; [blank record](human-validation.md) | Real identity/date/feedback, resulting changes and decision |
| Human UAT | PENDING setup/execution; 11 acceptance scripts prepared | Actual human observations/build/fixture IDs, defects and acceptance |
| Deployment | NOT RUN; [non-operational design](service-and-deployment-design.md) | Explicit approved target/provider/trigger/credential/cost/smoke/rollback scope, then actual deployment observations |
| Rollback | NOT RUN; no outcome or revision fabricated | Approved scope and observed verified restoration |

## Future hosted-run record — leave pending until real evidence exists

| Field | Verified value |
|---|---|
| Repository and exact committed ref (include paired repository where relevant) | |
| Approval, operator and trigger date | |
| Actual workflow run ID and URL | |
| Actual runner image/OS, Node/npm and locked tool versions | |
| Clean install outcome and lock hash | |
| Each job's status, tests and raw-output reference | |
| Blocked/skipped/unrun checks and reason | |
| Reviewed artifact paths/hashes, retention and access | |
| Human review and action on failures | |

## Future deployment/rollback observation record

| Field | Verified value |
|---|---|
| Explicit CD approval reference | |
| Environment/provider/project and artifact digest | |
| Operator, time and actual release/revision identifier | |
| Verified service/run link, if available | |
| Smoke test identities/data boundary and outcomes | |
| Rollback condition, authorization and actual revision | |
| Observed restored behavior/data and outstanding risks | |

No uploaded artifact or submission ZIP is implied. The local export tool uses the [reviewed allowlist](export-allowlist.json); raw traces, logs, request bodies, environment files and unreviewed screenshots are excluded. Previous phase summaries remain historical and unchanged. Phase 4 results are distinct, including the browser count change caused by retained hydration errors and the repaired lint-configuration declaration issue.
