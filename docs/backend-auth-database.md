# Backend, authentication, and database

This document focuses on **`plutus-be`** (NestJS): how the app boots, how auth works, and how data is stored in **MongoDB** via **Mongoose**.

## Application bootstrap

- **`main.ts`**: loads **`.env`** and **`.env.local`** from the `plutus-be` working directory, creates Nest app, enables **CORS**, enables **URI versioning** (routes are **`/v1/...`**), mounts **Swagger** at **`/api`**, listens on **`APP_PORT`** (default **3001**).
- **`app.module.ts`**: loads `ConfigModule` (global), `MongooseModule`, `StripeModule`, feature modules (`UserModule`, `AccountModule`). JWT auth is applied **per controller** (see below), not as a global guard.

## Authentication stack

| Piece | Responsibility |
|-------|----------------|
| **`AuthModule`** | `JwtModule.registerAsync`, `PassportModule`, Mongoose models for `User` + `Organisation`, `AuthService`, `JwtStrategy` |
| **`AuthController`** | `POST /v1/auth/register`, `POST /v1/auth/login` — **no** JWT guard (public routes) |
| **`AuthService.register`** | Ensures email unique; creates **Organisation** with unique `tenantId` slug; hashes password; creates **User** with role **admin** |
| **`AuthService.login`** | Validates credentials; signs JWT **`{ sub, tenantId, role }`**; returns **`{ accessToken, user }`** where `user` is a safe DTO (`id`, `email`, `name`, `role`, `tenantId`) |
| **`JwtStrategy`** | `ExtractJwt.fromAuthHeaderAsBearerToken()`, validates signature; **`validate`** maps payload to **`req.user`** (`userId`, `tenantId`, `role`) |
| **`AuthGuard('jwt')`** | On **`UsersController`**, protects **`GET/POST/PATCH /v1/users`** (Passport JWT) |
| **`RolesGuard`** + **`@Roles(...)`** | On **`POST /v1/users`** and **`PATCH /v1/users/:id/role`**, requires **`admin`** (runs after JWT; **`GET /v1/users`** is JWT-only, any tenant role) |

### JWT contents

Payload type (`jwt.strategy.ts`):

- **`sub`**: user id (string)
- **`tenantId`**: organisation slug
- **`role`**: `admin` | `editor` | `viewer`

### Login response (`POST /v1/auth/login`)

On success, the API returns the JWT and a **non-sensitive** user snapshot (mirrors claims, convenient for UI without decoding the token):

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "<mongo user id>",
    "email": "user@example.com",
    "name": "Jane Doe",
    "role": "admin",
    "tenantId": "my-organisation"
  }
}
```

### Environment

Copy **`plutus-be/.env.example`** to **`.env`** (or **`.env.local`**) in the **`plutus-be`** folder before **`npm run start:dev`**. Without **`DB_CONNECTION`**, Mongoose never connects and auth/user APIs will not persist **`passwordHash`** / **`organisationId`** correctly.

| Variable | Used by |
|----------|---------|
| `DB_CONNECTION` | **Required.** MongoDB URI (e.g. `mongodb://127.0.0.1:27017` or Atlas) |
| `DB_NAME` | Optional database name |
| `APP_PORT` | Listen port (default **3001**) |
| `JWT_SECRET` | Sign + verify tokens (default dev string if unset — change in production) |
| `JWT_EXPIRES_IN` | Access token lifetime (e.g. `7d`) |
| `STRIPE_SK` | Stripe secret key; if unset, a placeholder is used so the app can boot without billing |

## Database (MongoDB + Mongoose)

### Connection

- **`MongooseModule.forRootAsync`** uses **`ConfigService`**: **`DB_CONNECTION`** is **required** (`getOrThrow`); **`DB_NAME`** is optional.

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

### User role management contract

#### Admin: create user (tenant provisioning)

The dashboard calls **`POST /v1/users`** to add a user to the **same organisation / tenant** as the admin (persisted in MongoDB via the `User` model). This is **not** the same as `POST /v1/auth/register` (which creates a new organisation).

- **`POST /v1/users`**
  - Auth: `Bearer <jwt>` (required), caller must have role **`admin`**.
  - Headers: optional `x-tenant-id` (should match JWT `tenantId`).
  - Body (example):
    ```json
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "password": "min-8-chars",
      "role": "viewer"
    }
    ```
  - Behaviour:
    - Create `users` document with hashed password, `organisationId` / tenant scope from the admin’s token.
    - **Do not** issue a login session or return an `accessToken` for the new user (admin’s session is unchanged). If you return a user DTO, `{ id, email, name, role }` is enough.
  - Errors: `401` if not authenticated, `403` if not admin or tenant mismatch, `409` if email already exists in tenant.

#### Why new users see “Invalid credentials” on login

If the user row exists in MongoDB but `POST /v1/auth/login` returns **401** / “Invalid credentials”, the create-user path is almost always **not** compatible with `AuthService.login`:

1. **Password must be bcrypt-hashed into `passwordHash`** (same field and rounds as `AuthService.register`). Storing a plain `password` string, or writing to the wrong property, breaks `bcrypt.compare` in login.
2. **Email** should be stored normalized (lowercase); the FE now lowercases on login as well to match admin create.
3. **Login lookup** must find that user: typically `findOne({ email })` (globally unique email) or email + `organisationId` if your schema requires it — if login only matches the first user with that email in another tenant, you get a failed password compare.

Minimal fix in **plutus-be** (mirror register):

```ts
// In the handler/service for POST /v1/users (admin-only):
const passwordHash = await bcrypt.hash(dto.password, 10);
await this.userModel.create({
  email: dto.email.toLowerCase(),
  name: dto.name,
  passwordHash,
  role: dto.role,
  organisationId: admin.organisationId, // same as admin’s org
});
```

Then `AuthService.login` continues to use the same `bcrypt.compare(password, user.passwordHash)` as today.

Required endpoint for admin role assignment from FE:

- **`PATCH /v1/users/:id/role`**
  - Auth: `Bearer <jwt>` (required)
  - Headers: optional `x-tenant-id` (FE sends JWT tenantId for explicit tenant context)
  - Body:
    ```json
    { "role": "admin" }
    ```
    where role is one of `admin | editor | viewer`.
  - Response (recommended):
    ```json
    {
      "id": "user_id",
      "role": "editor",
      "tenantId": "tenant_slug",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
    ```

### Tenant and role guard enforcement

For `PATCH /users/:id/role`, backend must enforce:

- Requesting user role is `admin`.
- Target user belongs to the same tenant as requester (`jwt.tenantId`).
- Persisted user tenant matches request tenant guard.
- Reject cross-tenant updates with `403`.
- Reject unknown roles with `400`.
- Write an audit log entry (`entityType=user`, `action=role_updated`) with actor and before/after.

## Scheduling

- **`RenewalCron`**: `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)` → **`RenewalService.runDailyCron`**.

## API documentation

- Open browser: **`http://<host>:<port>/api`** (Swagger UI) when the server is running.

## Troubleshooting: user in MongoDB but login fails / no `passwordHash` or `organisationId`

The current **`POST /v1/users`** handler always writes **`passwordHash`** (bcrypt) and **`organisationId`**. If Compass shows a document **without** those fields:

1. **Wrong process** — An older or different backend may still be listening on the same port, or the API was not rebuilt after pulling (`npm run build` then restart `start:dev` / `start:prod`).
2. **Wrong database** — `DB_NAME` / connection string in the running server must match the database you inspect in MongoDB Compass.
3. **Legacy documents** — Rows created before this schema (or by another service) may lack `passwordHash`. **Delete** those users and create them again from **User management** after the correct API is running, or re-run **`POST /v1/auth/register`** for a fresh org.

After **`POST /v1/users`** succeeds, the server re-reads the inserted row; if **`passwordHash`** or **`organisationId`** did not persist, it returns **500** and removes the broken row so you are not left with a half-created account.

## Security notes for operators

- Rotate **`JWT_SECRET`** and invalidate old tokens when compromised.
- **`DB_CONNECTION`** must not be committed; use secrets in deployment platforms.
- Review **`@Public()`** endpoints (`auth`, `app` root/health, `stripe`, `account`) before exposing to the internet.
- Prefer **HTTPS** and secure cookie flags in production for any cookie-based session bridging.
