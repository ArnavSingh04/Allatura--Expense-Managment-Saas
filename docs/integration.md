# Frontend and backend integration

The frontend and backend are separate repositories. Browser domain requests pass through Next.js before reaching the Nest API.

## Routing and authentication

```text
Browser -> /api/v1/* (Next route handler)
        -> BACKEND_API_URL/* (Nest, normally /v1/*)
        -> guards -> tenant scope -> controller -> service -> MongoDB
```

[resolve-api-base-url.ts](../src/lib/resolve-api-base-url.ts) keeps browser API calls on the same origin. The [API route handler](../src/app/api/v1/%5B...path%5D/route.ts) implements the proxy; `next.config.js` is not the authentication forwarding layer.

The proxy obtains an Auth0 access token on the server and supplies `Authorization: Bearer ...`. It forwards selected `x-organisation-id` for scoped requests. The backend checks membership and derives its internal `tenantId`; client selection is not authorisation. See [login and sessions](LOGIN_AND_AUTH.md).

The server target is `BACKEND_API_URL`, then `INTERNAL_BACKEND_URL`, then `http://127.0.0.1:3001/v1`. It must include `/v1`. The proxy preserves response status, content type and content disposition; transport failures become `backend_unreachable` with status 502. It buffers request/response bodies rather than streaming them.

## Client contracts

| Client | Behaviour | Main callers |
| --- | --- | --- |
| [api-client.ts](../src/lib/api-client.ts) | HTTP failures throw `ApiError`; network/parsing errors can propagate unchanged. Provides JSON, multipart and blob helpers | Domain services and SWR fetchers |
| [api-helper.ts](../src/lib/api-helper.ts) | Returns `{ failed: true, error }` for request failures | Older `src/app/services` wrappers |

Both use the shared base-URL resolver and organisation headers. Replacing one requires updating and testing caller error handling. The `@/services/*` alias searches `src/services` before `src/app/services`; check resolution before introducing a same-named service.

[swr-keys.ts](../src/lib/swr-keys.ts) defines shared read paths. Writes use domain services and then invalidate affected keys. A mutation can affect detail, list, dashboard and financial views. Organisation switching performs a full navigation because cache keys do not include the organisation ID.

## Backend boundaries

The global pipeline is `JwtAuthGuard`, `StatusGuard`, `RolesGuard`, `PlanGuard`, then `TenantScopeInterceptor`. Public, pending-user and onboarding exceptions use route decorators. Services must still scope database queries to the resolved tenant and enforce domain rules.

Most construction schemas live in backend `src/schema`; organisation memberships also have a schema in `src/membership`. Align request/response types with controllers and DTOs rather than older design diagrams.

Money uses `{ amount, currency }` with integer minor units. Use money helpers at input/display boundaries and preserve currency expectations. The frontend role/action matrix controls UI visibility; API guards enforce authorisation.

## Documents, imports and billing

Browser document uploads request a signed URL, send bytes directly to storage, then ask the API to finalise metadata. This storage request is an exception to same-origin domain API traffic. Send the returned method/headers without API session headers. Finalisation checks object metadata; a signed URL alone does not establish completion.

Import uploads send files to the API for parsing and processing. Sessions and progress are stored in MongoDB, while background execution runs in the API process without a durable worker queue. Imports record row-level outcomes. See the [backend handover guide](../../plutus-be/docs/HANDOVER.md) before changing retries or completion behaviour.

Billing credentials and webhook handling belong to the backend. The frontend requests billing actions and follows returned URLs. Mock billing supports local development without establishing live payment acceptance.

## Checking integration changes

Run typecheck, lint and focused tests in both repositories when changing shared contracts. The frontend mocked-browser layer uses fixtures; the paired `stack` layer runs Next, Nest and disposable MongoDB. Backend `http` exercises the API and local identity fixture. See the [QA guide](../qa/ci/README.md) for commands and limitations.
