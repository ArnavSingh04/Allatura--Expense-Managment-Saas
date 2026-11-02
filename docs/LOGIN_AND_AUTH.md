# Login, sessions and organisation selection

Allatura uses Auth0 Universal Login. Next.js maintains the Auth0 session; the Nest API validates RS256 access tokens and resolves current organisation permissions from the database.

## Request flow

1. `/login` and `/register` redirect to Auth0 through `/auth/login`. Registration supplies the signup hint and returns to onboarding.
2. The Auth0 SDK handles the callback and session cookie through [src/proxy.ts](../src/proxy.ts) and [src/lib/auth0.ts](../src/lib/auth0.ts).
3. [AuthSessionContext](../src/app/contexts/AuthSessionContext.tsx) reads the Auth0 user and requests `auth/me` for the internal profile, memberships, role and status.
4. Browser domain requests go to `/api/v1/*`. The [route handler](../src/app/api/v1/%5B...path%5D/route.ts) obtains the access token on the server and forwards it as a bearer token.
5. The backend verifies signature, issuer, audience and expiry, resolves the internal user and selected membership, then applies status, role and plan checks.

The application API clients do not obtain bearer tokens from local storage. Remaining JWT payload helpers describe an earlier format and are not the current session authority.

## Profile and access states

`isAuthenticated` means Auth0 has resolved a signed-in user. It does not establish onboarding, active membership or permission for an action.

| State | Frontend behaviour |
| --- | --- |
| No Auth0 user | Offer sign-in |
| `needsOnboarding` | Create an organisation or accept the supplied invitation |
| `PendingApproval` / `Rejected` | Display the applicable access state; grant no action capabilities |
| `Active` | Evaluate the UI role/action matrix |
| Profile request failed | Show recovery for the error rather than remaining in a loading state |

The context retries transient network/server failures, but not permission failures. It polls while the resolved status is non-active and the tab is visible. Responses from a previous identity or effect generation are ignored so an older request cannot replace the current profile.

Frontend role gates control presentation. Backend guards and tenant-scoped service queries enforce access.

## Multiple organisations

An open tab binds requests to the organisation returned by `auth/me`. [organisation-binding.ts](../src/lib/organisation-binding.ts) supplies `x-organisation-id` for scoped requests. The proxy prefers that explicit header over the stored preference. The backend verifies membership; the header itself grants no authority.

The preference cookie is tied to the Auth0 subject. The [selection route](../src/app/api/active-organisation/route.ts) verifies that the requested organisation appears in the caller's memberships before updating it. Protected requests still require the applicable status and permissions. The switcher performs a full navigation, discarding page state and the current SWR cache. Cache keys are not namespaced by organisation, so preserve that navigation boundary.

Identity discovery and designated public routes omit organisation selection. This lets users discover valid memberships after losing access to a selected organisation. An existing tab must not silently retarget pending writes.

## Backend identity linking

The API first matches the Auth0 subject to `User.authID`. Its migration fallback links a pre-existing user by verified email only when the record is not already linked to another subject. Permissions come from the internal user or selected membership, not caller-supplied role claims.

`StatusGuard` checks the resolved membership and caches its status/version for up to 30 seconds. `JwtStrategy` obtains the request version from the database; a cache mismatch triggers a fresh read. This is not a token blacklist or a guarantee that logout revokes all issued Auth0 access tokens.

## Logout and recovery

The frontend clears its organisation binding and navigates through `/auth/logout`. Backend `POST /v1/auth/logout` currently returns `{ ok: true }`; it does not revoke provider tokens.

The proxy forwards requests without a bearer token when token retrieval fails, allowing public endpoints to remain reachable. Protected endpoints reject unauthenticated calls. For refresh failures, inspect the proxy warning and Auth0 offline-access configuration. Organisation-denial errors need membership/selection recovery rather than automatic treatment as expired authentication.

See [local setup](setup.md), [integration contracts](integration.md) and the [backend platform guide](../../plutus-be/docs/PLATFORM-SETUP.md).
