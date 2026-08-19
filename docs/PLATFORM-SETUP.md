# Frontend — Auth0 & Platform Setup

This app now authenticates with **Auth0** (`@auth0/nextjs-auth0` v4). The full
cross-stack guide (Auth0 tenants/API/Action, Mailgun, GCP) lives in the backend
repo at `plutus-be/docs/PLATFORM-SETUP.md`. This file covers the frontend
specifics.

## How auth works here

- **Sessions** are server-side, in an encrypted httpOnly cookie managed by the
  Auth0 SDK. The access token is **never** exposed to browser JS.
- `src/proxy.ts` (Next 16 proxy/middleware) mounts the SDK routes:
  `/auth/login`, `/auth/logout`, `/auth/callback`, `/auth/access-token`,
  `/auth/profile`, `/auth/backchannel-logout`.
- `src/app/api/v1/[...path]/route.ts` is a same-origin proxy: it reads the
  access token from the session (server-side) and forwards it as a Bearer token
  to the Nest backend. The browser calls `/api/v1/...` with no credentials.
- `src/lib/auth0.ts` constructs the `Auth0Client` from env.
- `AuthSessionProvider` (`src/app/contexts/AuthSessionContext.tsx`) combines the
  Auth0 `useUser()` state with `GET /auth/me` to expose `session`, `isActive`,
  `needsOnboarding`, `can(action)`, `login()`, `signOut()`.

## Flows

- **Sign in:** `/login` → `/auth/login` (Auth0 Universal Login) → `/dashboard`.
- **Sign up / create org:** `/register` → Auth0 signup → `/onboarding`
  (enter name + organisation name) → becomes `admin` of a new org.
- **Invitation:** email link → `/invite/<token>` (public preview) → Auth0 login
  → `/onboarding?invite=<token>` (enter name) → joins org with the invited role.
- **Admin invite management:** `/dashboard/users/pending` — invite by email +
  role (admin/finance/general), see pending/accepted/expired/revoked, resend or
  revoke.

## Required env (`.env.local`)

```
AUTH0_DOMAIN=allatura-dev.us.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_SECRET=<openssl rand -hex 32>
APP_BASE_URL=http://localhost:3000
AUTH0_AUDIENCE=https://api.allatura.app     # must match plutus-be AUTH0_AUDIENCE
AUTH0_SCOPE=openid profile email offline_access
NEXT_PUBLIC_BACKEND_API_URL=/api/v1
BACKEND_API_URL=http://localhost:3001/v1
```

Auth0 application config (callback/logout/web-origin URLs) is in the backend
guide, section 1b.
