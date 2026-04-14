# Codebase structure and how it works

This document maps **folders, subfolders, and important files** for the Plutus / Allatura stack and explains behavior at a **high level** (what each repo does) and a **lower level** (how requests, modules, and builds fit together).

The product is a **multi-tenant** app for **IT systems**, **contracts**, **renewals**, **analytics**, and **audit/import** flows. The UI is **Next.js**; the API is **NestJS**; data lives in **MongoDB** (Mongoose). JWT identifies users and carries **`tenantId`** for isolation.

For deeper architecture, API/tenant details, and feature-to-route tables, see also:

- [architecture.md](./architecture.md)
- [features.md](./features.md)
- [integration.md](./integration.md)

---

## High level: two repositories

| Repository | Stack | Role |
|------------|--------|------|
| **`plutus-fe`** | Next.js 16, React 19, App Router, Tailwind, MUI / HeroUI | Browser UI, same-origin or direct calls to `/v1` API |
| **`plutus-be`** | NestJS 11, Mongoose, Passport-JWT, Swagger, `@nestjs/schedule` | REST API under **`/v1`**, Swagger at **`/api`**, cron for renewals |

They are **separate git repositories**; align **environment URLs** and **API contracts** when you deploy or change either side.

---

## Folder structure (overview)

### `plutus-be` (NestJS backend)

```
plutus-be/
├── src/
│   ├── main.ts                 # Bootstrap: CORS, URI versioning v1, Swagger at /api, PORT
│   ├── app.module.ts         # Root module: Config, Mongo, Stripe, Schedule, feature modules, global guards
│   ├── app.controller.ts     # Public meta + /health (under versioned API)
│   ├── app.service.ts
│   ├── account/              # Account-related HTTP (legacy/billing helper; see features doc)
│   ├── analytics/            # Spend/insights endpoints
│   ├── audit/                # Audit log reads
│   ├── auth/                 # Login/register, JWT strategy, guards, @Public, @Roles
│   ├── contract/             # Contracts CRUD + calendar-related API
│   ├── import/               # CSV preview/import (multipart)
│   ├── renewal/              # Renewals + daily cron (RenewalCron → RenewalService)
│   ├── stripe/               # Stripe dynamic module + controller (billing)
│   ├── system/               # IT systems CRUD
│   ├── user/                 # Users for tenant
│   ├── schema/               # Mongoose schemas (shared data models)
│   └── types/                # e.g. express.d.ts for req.user typing
├── test/                     # e2e (Jest config: jest-e2e.json)
├── dist/                     # `nest build` output (not source of truth)
├── nest-cli.json
├── tsconfig.json, tsconfig.build.json
├── webpack-hmr.config.js     # Used with start:dev (HMR)
├── package.json
└── .env, .env.example        # DB_CONNECTION, JWT, Stripe, etc.
```

**`src/schema/`** (Mongoose): central place for persisted shapes, for example:

- `organisation.schema.ts`, `user.schema.ts`, `account.schema.ts`
- `it-system.schema.ts`, `contract.schema.ts`, `renewal-alert.schema.ts`, `audit-log.schema.ts`

Feature folders typically follow a **Nest feature module** layout:

- `*.module.ts` — wires imports (Mongoose `forFeature`, other modules), controllers, providers
- `*.controller.ts` — HTTP routes (often version **`v1`** via global versioning)
- `*.service.ts` — business logic and DB access
- `dto/` — request/response validation types
- `entities/` — optional (some modules use Mongoose schemas in `schema/` instead)

**Cross-cutting behavior** (configured in `app.module.ts`):

- **`JwtAuthGuard`** + **`RolesGuard`** are registered globally; use **`@Public()`** to skip auth and **`@Roles(...)`** for role checks
- **`MongooseModule.forRootAsync`** reads **`DB_CONNECTION`** / **`DB_NAME`**
- **`ScheduleModule`** enables **`RenewalCron`** (daily job)
- **`StripeModule`** builds the Stripe client (env key; placeholder allowed for boot)

---

### `plutus-fe` (Next.js frontend)

```
plutus-fe/
├── src/
│   ├── app/                    # Next.js App Router (routes = folders with page.tsx)
│   │   ├── layout.tsx          # Root layout: theme, fonts, color-mode script
│   │   ├── page.tsx            # Marketing home (/)
│   │   ├── login/, register/
│   │   ├── dashboard/          # Shell layout; subroutes for systems, contracts, renewals, etc.
│   │   ├── plans/, checkout-success/
│   │   ├── components/         # UI pieces (e.g. dashboard shell, sidebar) — see @/components alias
│   │   ├── services/           # Thin wrappers (e.g. FrontendService → ApiHelper)
│   │   ├── interfaces/         # TS types for UI/API
│   │   └── api/                # Next.js Route Handlers if present (path alias @/api)
│   ├── lib/                    # api-helper, resolve-api-base-url, swr-fetcher, etc.
│   ├── theme/                  # Design tokens, MUI theme integration
│   ├── utils/
│   ├── styles/
│   └── data/                   # Static or shared data helpers
├── public/                     # Static assets
├── docs/                       # Architecture, features, integration (this file)
├── next.config.js              # standalone output; rewrites /api/v1 → backend
├── package.json
├── tsconfig.json               # path aliases @/components, @/lib, …
└── .env.example, .env.local
```

**Typical dashboard routes** (under `src/app/dashboard/…`) align with sidebar navigation, for example:

- `/dashboard` — home / analytics widgets
- `/dashboard/systems`, `.../systems/new`, `.../systems/[id]`, `.../edit`
- `/dashboard/contracts`, `.../new`, `.../[id]`, `.../edit`
- `/dashboard/renewals`, `.../[id]`
- `/dashboard/calendar`
- `/dashboard/import`
- `/dashboard/audit`
- `/dashboard/settings`
- `/dashboard/form-example` (demo)

Exact file names follow Next.js conventions (`page.tsx`, `layout.tsx`, route groups if any).

**TypeScript path aliases** (from `tsconfig.json`):

| Alias | Points to |
|-------|-----------|
| `@/components/*` | `src/app/components/*` |
| `@/services/*` | `src/app/services/*` |
| `@/interfaces/*` | `src/app/interfaces/*` |
| `@/api/*` | `src/app/api/*` |
| `@/lib/*` | `src/lib/*` |
| `@/utils/*` | `src/utils/*` |
| `@/data/*` | `src/data/*` |
| `@/styles/*` | `src/styles/*` |
| `@/theme/*` | `src/theme/*` |

---

## Low level: how the backend runs

1. **`main.ts`** loads `.env` next to compiled output, creates the Nest app, enables **CORS**, enables **URI versioning** with default version **`1`** (so routes are effectively under **`/v1/...`**), serves **Swagger** at **`/api`**, listens on **`PORT`** / **`APP_PORT`** (default **3001**).
2. **`AppModule`** imports feature modules and registers **global guards**. Controllers use decorators for **public** routes and **roles**.
3. **`JwtStrategy`** validates Bearer tokens; **`req.user`** carries **`tenantId`** and **`role`** for services.
4. Services query Mongoose models with **tenant scoping** (see [integration.md](./integration.md)).
5. **`RenewalCron`** runs **`RenewalService.runDailyCron`** on a schedule (daily).

Build/run (see `package.json`): `nest build` → `dist/`; dev uses webpack HMR via **`start:dev`**.

---

## Low level: how the frontend talks to the API

1. **`NEXT_PUBLIC_BACKEND_API_URL`** should include **`/v1`** (see `.env.example` in each repo).
2. **`ApiHelper`** (`src/lib/api-helper.ts`) builds URLs, attaches **`Authorization: Bearer`** from stored token, and performs `fetch`.
3. **`resolve-api-base-url.ts`** can rewrite localhost backend URLs to **`/api/v1`** on the same origin so the browser hits Next first.
4. **`next.config.js`** **rewrites** `'/api/v1/:path*'` → your backend base (e.g. `http://localhost:3001/v1/...`), avoiding CORS pain in local dev.

Auth token storage and cookie mirroring are described step-by-step in [integration.md](./integration.md).

---

## CI / automation

- **`plutus-fe/.github/workflows/`** — CI for the frontend (lint/build as configured).
- Add or mirror workflows under **`plutus-be/.github/`** if the backend repo uses GitHub Actions (not duplicated here).

---

## Mental model summary

- **High level:** two apps — **Next.js** for UI, **NestJS** for JSON API — one **MongoDB**, shared **JWT + tenantId** contract.
- **Low level:** Nest **modules** + **guards** + **Mongoose schemas**; Next **App Router** + **`ApiHelper`** + **rewrites** to **`/v1`**.

When you add a feature, usually you add or extend a **backend module** under `plutus-be/src/<feature>/`, a **schema** if needed under `plutus-be/src/schema/`, and a **route + UI** under `plutus-fe/src/app/...` using **`ApiHelper`** or SWR helpers in `src/lib/`.
