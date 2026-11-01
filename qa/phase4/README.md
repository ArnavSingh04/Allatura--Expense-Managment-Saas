# Phase 4: prepared CI and selected evidence

Prepared locally on 1 November 2026. No commit, push, hosted workflow dispatch, deployment, secret change or real business-service call occurred. This is a prepared QA pipeline and local evidence, not completed CI/CD or release approval. [Local results](evidence/local-matrix.json), [changes](evidence/change-inventory.json), [preservation](evidence/preservation.json), [defects](defect-register.md), [risk matrix](requirement-risk-matrix.md), [human review/UAT](human-validation.md) and [CI/CD evidence status](ci-cd-evidence.md) have separate purposes.

## Layout and ownership

`plutus-fe` and `plutus-be` are independent sibling repositories, not one npm workspace. Each new `.github/workflows/qa.yml` operates from its own checkout root. Cross-repository documentation/export assumes both reviewed checkouts are siblings with those names; the individual CI jobs do not assume a sibling checkout. The coordinator owns workflows, scripts, configuration, evidence and export selection. The planner authored only `human-validation.md` and `requirement-risk-matrix.md`; the backend tester authored only `defect-register.md`. The independent AI reviewer is a separate read-only agent. At most three workers were active; no overlapping writes occurred.

The pre-existing FE `.github/workflows/main.yml` remains byte-for-byte unchanged. It is a token-backed mirror from `develop` to a personal repository, including force push; it is not QA or deployment evidence. Its existing token reference and success fallback were not copied into the new workflows, and it was not executed. The BE initially had no workflows. Repository default branches and hosted settings were not queried; current checked-out branches remain FE `develop` and BE `development`.

## Prepared workflow gates

Both workflows have only a manual `workflow_dispatch` trigger, read-only `contents` permission, no stored checkout credential, no upload/deploy/service step and no secrets inputs. Checks are independent: matrix `fail-fast: false`, maximum three matrix jobs in parallel, no `needs` chain hiding later results, no allowed failure, and no test skip to hide missing isolation. Each process failure propagates to its job. The integration-precondition job deliberately fails with exit 2 before installation or service setup; it is not an implemented real-stack suite.

| Repository | Independent gates |
|---|---|
| FE | Full units/components, preserved workspace VM tests, full types, complementary QA types, lint, webpack production build, workflow-policy tests; separate three-engine mocked-browser job; separate blocked real-stack gate |
| BE | Full source units, focused QA units with coverage, safety probes, narrow public-controller HTTP contract, full types, complementary QA types, lint, Nest build, workflow-policy tests; separate blocked database-HTTP gate |

The selected action refs are full commit SHAs verified against their publisher release commits: [checkout v4.2.2](https://github.com/actions/checkout/commit/11bd71901bbe5b1630ceea73d27597364c9af683) and [setup-node v4.4.0](https://github.com/actions/setup-node/commit/49933ea5288caeca8642d1e84afbd3f7d6820020). Manual triggers, permissions and matrix syntax were checked against [GitHub's workflow syntax reference](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax). This source check does not establish action execution or hosted acceptance.

## Toolchain and installation

Validated local runtime: Windows, Node **24.15.0**, npm **11.12.1**. FE: Next 16.2.1, React/DOM 19.2.4, TypeScript 5.9.3, Vitest 3.2.6, RTL 16.3.0 and Playwright 1.58.2. BE: Nest core 11.1.18, Mongoose 8.23.0, Jest 29.7.0, ts-jest 29.4.9, Supertest 7.2.2 and TypeScript 5.9.3. ESLint is 9.39.4; BE TypeScript ESLint is 8.58.0; installed locked YAML parser is js-yaml 4.1.1. Full supporting versions remain in Phase 2/3 reports and selected JSON. No package or lockfile was changed in Phase 4.

The new workflows use `windows-2025` because the reviewed harness uses Windows junctions/process management and a Windows browser bundle. The image label is not an immutable OS image; its actual hosted image version must be recorded at execution. The CI wrapper checks exact Node/npm/platform before setup and fails on mismatch. It does not install an arbitrary newer npm.

On an approved clean CI runner, `node scripts/qa/ci-job.cjs --layer <layer>` invokes the repository's `scripts/qa/prepare.cjs`, then the selected gate. Preparation copies the unchanged manifest/lock into an owned dependency directory and runs exactly `npm ci --ignore-scripts --no-audit --no-fund` with empty owned npm configs, owned cache and minimal environment. FE browser preparation installs the three binaries matching pinned Playwright. Existing checkout dependencies are not overwritten. Preparation may retrieve public dependencies only when that execution is separately approved; no lifecycle hook is enabled indiscriminately.

No fresh install was executed in Phase 4. Local checks used the previous FE owned installation and existing BE installation. BE's preserved WIP imports `mongodb-memory-server`, absent from manifest/lock but present extraneously locally: a fresh locked tree may additionally report TS2307. Bcrypt's native install hook is disabled; current selected source/test checks do not import it, but production/native runtime readiness remains unverified. Neither limitation justifies adding an unapproved dependency or enabling all install scripts.

## Reproduce local checks safely

From the respective root, with the reviewed existing dependencies:

```text
node scripts/qa/validate-ci.cjs
node --test qa/ci/validation.test.cjs
node scripts/qa/run-isolated.cjs --layer typecheck
node scripts/qa/run-isolated.cjs --layer qa-typecheck
node scripts/qa/run-isolated.cjs --layer unit
node scripts/qa/run-isolated.cjs --layer lint
node scripts/qa/run-isolated.cjs --layer build
```

FE additionally runs `--layer legacy-unit`, `--layer mocked-browser`, `--layer stack`, and `node --test qa/ci/export.test.cjs`. BE additionally runs `--layer qa-unit`, `--layer harness`, `--layer contract`, and `--layer http`. These are one-shot commands. The existing BE `npm run lint` includes `--fix`; do not substitute it. The new lint layer uses installed recommended JS/TypeScript rules without mutating files. Full checks retain WIP failures; focused checks do not replace them.

The phase's exact command arrays, run IDs, native exit codes, counts, hashes and attempts are in [local-matrix.json](evidence/local-matrix.json). Failed/blocked child exits are preserved even when a shell wrapper displays a generic exit 1. Initial BE build failure TS2742 from the new lint-config inference was repaired with an explicit `Linter.Config[]` annotation; the successful retest is separate evidence. No source exclusion or product change made it green.

The local matrix rerun produced:

| Gate | Outcome |
|---|---|
| FE units/harness | 45 passed: 37 component cases + 8 probes |
| FE workspace VM | 6 passed / 8 failed |
| FE browser | 20 passed / 19 failed, 39 executions, no skips/retries; Chromium 6/7, Firefox 9/4, WebKit 5/8 pass/fail |
| FE full types/build | Failed on preserved organisation-switcher WIP; 5 type diagnostics |
| FE lint | 13 errors / 4 warnings |
| BE full units | 214 cases passed; one WIP suite failed compilation, so overall FAIL |
| BE focused units | 106 passed, already included in the full-unit count |
| BE harness/public HTTP | 15 probes and 4 narrow HTTP cases passed |
| BE full types | 3 preserved WIP diagnostics |
| BE lint | 58 errors / 0 warnings newly surfaced by configured lint, including prior harness findings; this is a new baseline, not 58 new code regressions |
| BE build | Passed after the QA config annotation repair |
| Focused QA types | Passed in both repositories |
| Workflow/export checks | Each repository: 14 policy tests passed; FE additionally: one multi-assertion export safety test passed |
| Real-system gates | BLOCKED, exit 2 in both direct and CI-wrapper invocation |

Different browser counts from Phase 3 reflect the retained timing-sensitive hydration failure; this run did not replace it with retries or weaker expectations. Earlier evidence remains unchanged. All browser fixture boundaries still mock auth/domain responses, and all real persistence/security journeys remain blocked. Coverage is measured separately per provider/scope in selected evidence, with no invented passing threshold. [Fixture/service lifecycle design](service-and-deployment-design.md) describes the current and future boundaries.

## Evidence export and remaining approval

No CI upload action is configured. Raw logs, coverage, screenshots and traces remain in the previously agreed ignored directories; new working reports and exports stay under `.qa-agent-work/ci-phase-2026-11-01/`. These ignore rules are not export authorization. The [reviewed allowlist](export-allowlist.json) enumerates exact relative source paths and SHA-256 values; `node scripts/qa/export-evidence.cjs` verifies them, and `--write` creates a new owned local directory with only those bytes and a provenance manifest. Nothing is uploaded or zipped implicitly. Changed hashes, duplicate/case-colliding paths, missing files, links and traversal fail before copying. The extra token-pattern screen is not a substitute for deliberate review.

The selected package contains evidence and documentation only. Source-code/test/configuration links require the paired repositories; it is deliberately not a full source submission or raw-output archive. The retained generic 404 screenshot is the unchanged reviewed Phase 3 image, with its original run provenance, not relabeled as a new Phase 4 capture.

The actual verification/materialization outcome is recorded separately in [the export receipt](evidence/export-result.json), outside the exported selection to avoid circular artifact hashes.

## Proposed independent Phase 5 validation matrix

| Validation | Independent proof to collect | Prerequisite / limit |
|---|---|---|
| Source and ownership | Match both commit IDs plus local-diff/source hashes; confirm original WIP/mirror and allowed edits | Read-only recheck; no assumed clean worktree |
| Reproducible toolchain | Fresh locked install on an approved disposable Windows runner; compare exact versions and missing/native dependency behavior | Installation/network execution approval and prepared dependencies; retain new clean-install failures |
| Failing gate controls | Independently inspect policy negatives and verify nonzero type/lint/test/build/blocked exits reach job status | Local checks are distinct from hosted execution; no failure overrides |
| Mocked browser reproducibility | Run all three engines with exact synthetic fixtures, no retries; preserve actual failure classes and counts | Development UI only; cannot prove backend persistence or production readiness |
| Real system design | Review native outbound containment, actual provider identity, seeds/reset ownership, allowed/denied persistence assertions | Execution stays BLOCKED until separately approved environment is proven; no false green placeholder |
| Export | Verify exact allowlist/hashes, selected screenshot provenance and absence of unreviewed raw content; inspect local package | Evidence-only bundle; source references require the paired checkouts |
| Human review/UAT | Named independent human feedback and completed acceptance records with actual build/fixture identities | No AI substitute; interactive/real-system setup and testers are pending |
| Hosted CI / deployment evidence | Verified actual run/release identifiers, smoke and authorized rollback observations | Separately authorized execution, target and side effects; presently NOT RUN |

Human peer review and UAT remain PENDING. Hosted CI requires separate approval of repositories/refs, manual trigger, runner/cost and public dependency retrieval. Actual CD additionally requires the explicit target/provider/project, credential mechanism, permitted side effects, smoke checks and rollback scope in the non-operational deployment design. No implied push, dispatch or deployment follows this phase.
