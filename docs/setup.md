# Local development setup

Keep `plutus-fe` and `plutus-be` next to each other. Each has its own Git history, lockfile and commands. The frontend's workspace file opens both folders.

## Prerequisites

- Node.js **24.15.0** with bundled npm **11.12.1**, matching the checked-in QA configuration.
- Git and network access for dependency installation.
- For interactive development: an authorised MongoDB replica set and an Auth0 application/API. Invitation acceptance and user-status changes use transactions.

Automated checks use synthetic configuration and temporary source copies. They do not need the interactive application's credentials; see [isolated checks](#isolated-checks).

## Backend

From `plutus-be`, install the locked dependencies. In PowerShell:

```powershell
$env:MONGOMS_DISABLE_POSTINSTALL = '1'
npm ci
Remove-Item Env:MONGOMS_DISABLE_POSTINSTALL
```

If `.env` does not already exist, copy `.env.example` to `.env`. Configure:

| Variable | Purpose |
| --- | --- |
| `DB_CONNECTION`, `DB_NAME` | Replica-set connection and dedicated development database |
| `PORT` or `APP_PORT` | API port; defaults to `3001`, with `PORT` taking precedence |
| `APP_URL` | Frontend origin, normally `http://localhost:3000` |
| `AUTH0_ISSUER_BASE_URL` or `AUTH0_DOMAIN` | Auth0 issuer/domain |
| `AUTH0_AUDIENCE` | API identifier; must match the frontend |
| `AUTH0_NAMESPACE` | Prefix for email and verification claims added by the Auth0 Login Action |
| `BILLING_MODE`, `STRIPE_MODE` | Use `mock` and `test` for development without payment processing |
| `EMAIL_TRANSPORT` | Use `log` to inspect invitation links locally |

The [backend platform guide](../../plutus-be/docs/PLATFORM-SETUP.md) describes Auth0 claims and optional email/storage configuration. The API validates Auth0 tokens; `JWT_SECRET` and `JWT_EXPIRES_IN` are not the current login configuration. Real document uploads need a configured GCS bucket. The import buffer's local storage fallback does not provide browser document uploads.

Start the backend with `npm run start:dev`. The API uses `/v1`; Swagger is available at `http://localhost:3001/api` outside production mode. `start:dev:hmr` is the separate webpack/HMR command.

## Frontend

From `plutus-fe`, run `npm ci`. If `.env.local` does not exist, copy `.env.example` to `.env.local` and configure:

| Variable | Purpose |
| --- | --- |
| `AUTH0_DOMAIN` | Auth0 domain, without `https://` |
| `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` | Regular Web Application credentials |
| `AUTH0_SECRET` | Locally generated 32-byte hexadecimal secret for session encryption |
| `APP_BASE_URL`, `NEXT_PUBLIC_APP_URL` | Frontend origin, normally `http://localhost:3000` |
| `AUTH0_AUDIENCE` | Same API identifier as the backend |
| `AUTH0_SCOPE` | `openid profile email offline_access` |
| `NEXT_PUBLIC_BACKEND_API_URL` | `/api/v1`, the browser's same-origin API path |
| `BACKEND_API_URL` | `http://127.0.0.1:3001/v1`, the server proxy's upstream target |

Start the frontend with `npm run dev`, then open `http://localhost:3000`. Development and build commands select webpack as configured in `package.json`.

The Auth0 application needs the local callback `http://localhost:3000/auth/callback`, logout URL and web origin. The API audience and Login Action namespace must agree with the backend configuration. Offline access must be enabled for refresh tokens. See [login and session behaviour](LOGIN_AND_AUTH.md).

Both `/login` and `/register` redirect to Auth0. After authentication, `auth/me` determines whether onboarding, approval or dashboard access is required. The application API clients do not store their own bearer token.

## Isolated checks

Run these commands separately from each repository:

```text
node scripts/qa/prepare.cjs
node scripts/qa/run-isolated.cjs --layer typecheck
node scripts/qa/run-isolated.cjs --layer lint
node scripts/qa/run-isolated.cjs --layer unit
node scripts/qa/run-isolated.cjs --layer build
```

Preparation installs locked dependencies into an ignored QA directory with lifecycle scripts disabled. The launcher copies reviewed source into a temporary directory, supplies synthetic configuration and records results under `qa-raw/`. It does not install the root dependencies used for interactive development.

The [frontend QA guide](../qa/ci/README.md) and [backend QA guide](../../plutus-be/qa/ci/README.md) describe browser, HTTP and paired-stack layers, runtime preparation and validation limits. Historical reports describe their recorded revisions; rerun checks for changed source.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| API startup reports missing `DB_CONNECTION` | Development `.env` and its database settings |
| Proxy returns `backend_unreachable` / 502 | Backend process, port and `BACKEND_API_URL`; use `127.0.0.1` to avoid a local IPv6 mismatch |
| Login succeeds but API calls return 401 | Matching audience/issuer, Login Action claims and server token retrieval |
| Session later expires without refresh | Auth0 offline-access setting; sign in again after correcting it |
| Workspace access is denied | Current organisation membership and status |
| Document upload reports unconfigured storage | GCS bucket, signing credentials and bucket CORS |

For a local production build, run `npm run build` in each repository, then backend `npm run start:prod` and frontend `npm start`. Public frontend environment values are embedded at build time. These local commands do not establish that hosted deployment has been validated.
