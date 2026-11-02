# Frontend maintenance and handover

This guide describes the current source layout and the contracts to preserve when changing it. Start with the [README](../README.md) for commands and [setup](setup.md) for environment configuration. Record both repository revisions when a change crosses the frontend/API boundary.

## Follow a request

1. A route under `src/app/` renders shared controls from `src/app/components/` and calls a domain service under `src/services/`.
2. `src/lib/api-client.ts` sends the request through `/api/v1`, attaches the tab's organisation selection and retains structured API error details.
3. `src/app/api/v1/[...path]/route.ts` obtains the Auth0 access token server-side and forwards the request to the Nest `/v1` API.
4. Nest resolves the authenticated user's membership and applies its permission, plan and tenant checks before the domain service reads or writes data.

The separate `src/proxy.ts` entry delegates session handling and Auth0 routes to the SDK. It is distinct from the API forwarding route. `next.config.js` does not define an API rewrite.

## Contracts to preserve

| Area | Implementation and maintenance rule |
| --- | --- |
| Identity and membership | `AuthSessionContext.tsx` combines the Auth0 identity with `/auth/me`. Authentication, completed onboarding and active membership are separate states. Ignore stale profile responses after identity changes. |
| Organisation selection | `organisation-binding.ts` binds requests to the current tab. The preference cookie helps select an organisation on page load; backend membership checks decide whether it is allowed. Do not let another tab's selection retarget an in-flight write. |
| Permissions | `rbac.ts` controls available UI actions. A hidden button does not enforce server authorisation; update and test the backend endpoint as well. |
| Money | `Money.amount` is in minor units, normally AUD cents. Convert form input with `toMinor` and display with `toMajor` or the formatting helpers. Backend financial calculations define persisted totals. |
| Uploads | `uploadFile` in `src/services/documentService.ts` obtains a signed URL, sends bytes, finalises the upload and reloads metadata. A `stub://` URL or failed upload/finalisation must remain an error. |
| Return destinations | Use `safe-return-to.ts` for login return paths. Keep validation at the navigation boundary. |
| Errors and caching | Keep structured `ApiError` details where the UI needs them. After a mutation, invalidate the affected SWR keys from `swr-keys.ts`; consider related lists and dashboard totals. |

The `@/services/*` alias resolves `src/services/*` first, then `src/app/services/*`. The latter contains the older `frontendService.ts` wrapper. Several API helpers remain for existing callers. Check imports and their error contracts before consolidating them; put new domain calls beside their peers in `src/services/`.

## Adding or changing a feature

1. Agree the API request, response, money units, permissions and error states with the backend change. Update the relevant types in `src/types/`.
2. Add the domain service method, then the route or component. Reuse the existing session, organisation and transport helpers.
3. Handle initial loading, empty results, denied access, submission progress and recoverable failures. Keep the first client render consistent with server output.
4. Add focused tests for the behaviour that changed. Component tests cover user interactions with mocked dependencies; browser tests cover routing and page behaviour. Use paired stack tests when the change depends on persisted API behaviour.
5. Run the applicable [validation commands](../README.md#validation), inspect the diff, and update the affected guide or API contract. Include both commit identifiers in any paired test report.

## Comments and review

Comments should explain a business rule, unit, boundary, side effect or non-obvious decision. Describe the reason a branch exists instead of repeating its syntax. Use short JSDoc for shared contracts when the signature does not explain them. Avoid narrative implementation notes, authorship labels and claims such as “guarantees tenant isolation” that a local helper cannot establish.

Check existing comments when changing behaviour. Keep examples consistent with executable code. Use a tracked issue or a specific explanation for unfinished work so the next developer can act on it.

## Known limits and evidence

The comment review identified these paths for a separate behaviour review. They were inspected in source; the failure scenarios were not reproduced during this cleanup:

- [Import mapping queue](../src/app/components/import/useImportSession.ts): failed queued writes resolve as `undefined`, so flushing the queue does not itself establish that every mapping was saved. Check whether preview/confirmation can use an earlier mapping after a save failure.
- [Variation submission](../src/app/components/construction/VariationDialog.tsx): creation and submission are separate calls. If submission fails after creation, retrying Save can create another draft; consider retaining the successful draft ID.
- [Progress drafts](../src/app/dashboard/projects/%5Bid%5D/progress/page.tsx): project revalidation replaces local department drafts. Check preservation of unsaved edits when focus or background refresh updates the project.

The [defect register](../qa/defects.md) records open work, including broader accessibility and workflow coverage. The existing real-stack browser suite is limited to supplier scenarios with synthetic identity. Mocked browser responses do not establish backend permissions or provider behaviour.

The dated [QA report](../qa/frontend-testing.md) retains historical failures and subsequent remediation results. The [CI guide](../qa/ci/README.md) describes the private backend checkout requirement. Those records do not establish a passing run for future revisions, hosted provider acceptance, stakeholder UAT or deployment approval.

Use the [documentation index](README.md) to distinguish maintained guides from earlier architecture and presentation snapshots. When they disagree with current code, verify the implementation and update the maintained guide.
