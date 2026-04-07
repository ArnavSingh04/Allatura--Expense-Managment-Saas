# Backend, authentication, and database

This document focuses on **`plutus-be`** (NestJS): how the app boots, how auth works, and how data is stored in **MongoDB** via **Mongoose**.

## Application bootstrap

- **`main.ts`**: loads `.env` from next to compiled output, creates Nest app, enables **CORS**, enables **URI versioning** with default version **`1`** (routes are `/v1/...`), mounts **Swagger** at **`/api`**, listens on **`PORT`** or **`APP_PORT`** or **3001**.
- **`app.module.ts`**: loads `ConfigModule` (global), `ScheduleModule`, `MongooseModule`, `StripeModule`, feature modules, and registers **global guards**: `JwtAuthGuard`, `RolesGuard`.

## Authentication stack

| Piece | Responsibility |
|-------|----------------|
| **`AuthModule`** | `JwtModule.registerAsync`, `PassportModule`, Mongoose models for `User` + `Organisation`, `AuthService`, `JwtStrategy` |
| **`AuthController`** | `POST /v1/auth/register`, `POST /v1/auth/login` — both **`@Public()`** |
| **`AuthService.register`** | Ensures email unique; creates **Organisation** with unique `tenantId` slug; hashes password; creates **User** with role **admin** |
| **`AuthService.login`** | Validates credentials; signs JWT payload **`{ sub, tenantId, role }`** |
| **`JwtStrategy`** | `ExtractJwt.fromAuthHeaderAsBearerToken()`, validates payload shape |
| **`JwtAuthGuard`** | Skips auth when handler/class has **`@Public()`** |
| **`RolesGuard`** | Enforces **`@Roles('admin', 'editor', ...)`** when present |

### JWT contents

Payload type (`jwt.strategy.ts`):

- **`sub`**: user id (string)
- **`tenantId`**: organisation slug
- **`role`**: `admin` | `editor` | `viewer`

### Environment

| Variable | Used by |
|----------|---------|
| `JWT_SECRET` | Sign + verify tokens (default dev string if unset — change in production) |
| `JWT_EXPIRES_IN` | Access token lifetime (e.g. `7d`) |

## Database (MongoDB + Mongoose)

### Connection

- **`MongooseModule.forRootAsync`** reads **`DB_CONNECTION`** (required) and **`DB_NAME`**.
- Connection timeouts are set (15s) for server selection and connect.

### Main collections (schemas)

| Schema file | Collection / notes |
|-------------|-------------------|
| `organisation.schema.ts` | `organisations`: `name`, unique `tenantId` |
| `user.schema.ts` | `users`: email, `passwordHash`, `role`, `organisationId`, optional external ids |
| `it-system.schema.ts` | `itsystems`: per-tenant systems, owners, criticality |
| `contract.schema.ts` | `contracts`: links to system, costs, renewal dates, soft delete |
| `renewal-alert.schema.ts` | `renewalalerts`: contract renewals, status, decisions |
| `audit-log.schema.ts` | Audit entries for tenant activity |
| `account.schema.ts` | Used by legacy **`AccountModule`** (public REST under `/v1/account`) |

Domain data is isolated by **`tenantId`** string on documents where applicable.

## Feature modules (REST)

All routes are under **`/v1`** unless you change versioning.

| Module | Controller prefix | Notes |
|--------|-------------------|--------|
| `UserModule` | `users` | Tenant user listing; some routes may be legacy-style lookups |
| `SystemModule` | `systems` | CRUD + tenant filters |
| `ContractModule` | `contracts` | CRUD, calendar, tenant scope |
| `RenewalModule` | `renewals` | List, detail, decision PATCH |
| `AnalyticsModule` | `analytics` | Summary and spend breakdowns |
| `AuditModule` | `audit` | Paginated audit with filters |
| `ImportModule` | `import` | CSV preview + systems import (multipart) |
| `StripeModule` | `stripe` | **Public** routes for session/subscription helpers |
| `AccountModule` | `account` | **Public** account CRUD helpers (billing-related) |

## Scheduling

- **`RenewalCron`**: `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)` → **`RenewalService.runDailyCron`**.

## API documentation

- Open browser: **`http://<host>:<port>/api`** (Swagger UI) when the server is running.

## Security notes for operators

- Rotate **`JWT_SECRET`** and invalidate old tokens when compromised.
- **`DB_CONNECTION`** must not be committed; use secrets in deployment platforms.
- Review **`@Public()`** endpoints (`auth`, `app` root/health, `stripe`, `account`) before exposing to the internet.
- Prefer **HTTPS** and secure cookie flags in production for any cookie-based session bridging.
