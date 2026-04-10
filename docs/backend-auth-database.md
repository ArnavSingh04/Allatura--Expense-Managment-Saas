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

## Security notes for operators

- Rotate **`JWT_SECRET`** and invalidate old tokens when compromised.
- **`DB_CONNECTION`** must not be committed; use secrets in deployment platforms.
- Review **`@Public()`** endpoints (`auth`, `app` root/health, `stripe`, `account`) before exposing to the internet.
- Prefer **HTTPS** and secure cookie flags in production for any cookie-based session bridging.
