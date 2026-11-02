# Allatura frontend

Allatura is a construction management application for organisations, projects, contracts, variations, expenses, payment claims and supporting documents. This repository contains the Next.js 16 / React 19 frontend. The paired NestJS API and MongoDB models live in `plutus-be`.

Keep the two Git repositories beside each other for local development and the paired system tests:

```text
Allatura/
  plutus-fe/    # This repository
  plutus-be/    # Backend API
```

## Local development

Use Node.js **24.15.0** and its bundled npm **11.12.1** to match the current Windows QA toolchain. Install the locked dependencies from this repository's root:

```powershell
npm ci
```

Create `.env.local` from [`.env.example`](.env.example) if it does not already exist, then fill in the development Auth0 application settings. Keep local credentials out of Git.

| Setting | Local value or purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` and `APP_BASE_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_BACKEND_API_URL` | `/api/v1`, the browser's same-origin API path |
| `BACKEND_API_URL` | `http://127.0.0.1:3001/v1`, the server-side upstream, including `/v1` |
| `AUTH0_DOMAIN` | Development Auth0 tenant domain, without `https://` |
| `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET` | Auth0 web application credentials and session encryption secret |
| `AUTH0_AUDIENCE` | The API identifier also configured in the backend |
| `AUTH0_SCOPE` | Normally `openid profile email offline_access` |

Start the backend using its [README](../plutus-be/README.md), then run:

```powershell
npm run dev
```

Open [localhost:3000](http://localhost:3000). The browser sends API requests to `/api/v1`; a Next route handler attaches the Auth0 access token server-side and forwards to Nest. Billing credentials belong in the backend. See [local setup](docs/setup.md) and [authentication](docs/LOGIN_AND_AUTH.md) for the complete configuration and troubleshooting steps.

`npm run build` creates a production build; `npm start` serves that build. Set deployment values before building because `NEXT_PUBLIC_*` settings are compiled into browser assets.

## Validation

The isolated QA runners create temporary source stages with synthetic configuration and write local reports under ignored `qa-raw/` directories. Dependency and browser preparation uses a separate `.qa-agent-work/` directory.

```powershell
node scripts/qa/prepare.cjs --browsers
npm test
npm run typecheck
npm run lint
node scripts/qa/run-isolated.cjs --layer build
npm run test:browser
```

For the real frontend/API/database supplier scenarios, first prepare backend QA dependencies with `node scripts/qa/prepare.cjs` in `plutus-be`, then run `npm run test:stack` here. These tests use a disposable local MongoDB replica set and synthetic identity. They do not exercise hosted Auth0, live payments, email delivery or cloud storage.

See [QA commands and evidence](qa/frontend-testing.md), [CI and paired-repository setup](qa/ci/README.md), and the [defect register](qa/defects.md). Dated results describe their recorded source state; rerun the applicable checks for a new change.

## Repository map

| Location | Responsibility |
| --- | --- |
| `src/app/` | App Router pages, layouts, API route handlers and shared UI |
| `src/app/contexts/AuthSessionContext.tsx` | Internal profile, membership selection and session state |
| `src/services/` | Domain API calls |
| `src/lib/` | API transport, organisation binding, permissions, money and shared helpers |
| `src/types/` | Construction and import contracts used by the UI |
| `src/theme/`, `src/styles/`, `public/` | Theme, styles and static assets |
| `tests/` | Unit, component and browser scenarios |
| `scripts/qa/`, `qa/` | Isolated runners, test guidance and dated evidence |

Start the handover with [the maintenance guide](docs/HANDOVER.md). The [documentation index](docs/README.md) separates current guides from earlier design material.
