# How the parts integrate

This document traces a request from the UI to persistence and back.

## 1. Configuration chain

1. **Frontend** reads `NEXT_PUBLIC_BACKEND_API_URL` (and optional `BACKEND_API_URL` on the server).
2. **`ApiHelper`** (`src/lib/api-helper.ts`) builds URLs as  
   `{base}/{endpoint}/{urlParams}`  
   where `base` is the env URL (must include `/v1`). You can set **`NEXT_PUBLIC_BACKEND_API_URL=/api/v1`** so the browser uses same-origin requests; **`SWR`** helpers use **`resolveApiBaseUrl()`** which may map a full `localhost` backend URL to that proxy path.
3. **Browser vs server**: `resolveApiBaseUrl()` (`src/lib/resolve-api-base-url.ts`) may rewrite a **localhost** backend URL to **`{origin}/api/v1`** so fetches go to Next.js first.
4. **Next.js rewrites** (`next.config.js`):  
   `source: '/api/v1/:path*'` → `destination: '{BACKEND_API_URL}/:path*'`  
   So `/api/v1/auth/login` becomes `http://localhost:3001/v1/auth/login` when `BACKEND_API_URL` is `http://localhost:3001/v1`.

## 2. Authentication flow

1. User submits email/password on **`/login`**.
2. Frontend calls **`POST .../auth/login`** with `ApiHelper`, **`includeKey = false`**, and **`skipSessionHeaders = true`** so an old JWT in `localStorage` is not sent on this `@Public()` route (otherwise some deployments return **401** before password validation).
3. Backend **`AuthService`** validates password with **bcrypt**, loads organisation, signs a **JWT** with `JwtService` (`AuthModule`).
4. Response includes **`accessToken`** and user profile; frontend **`setAuthToken`** stores JWT in **localStorage** and sets a **cookie**.
5. Subsequent **`ApiHelper.fetchRequest`** calls add **`Authorization: Bearer <token>`**.
6. **`JwtAuthGuard`** (registered globally in `AppModule`) runs on every route unless **`@Public()`** is set.
7. **`JwtStrategy`** (`passport-jwt`) extracts the bearer token, verifies with **`JWT_SECRET`**, and attaches **`req.user`** (`userId`, `tenantId`, `role`).

## 3. Authorization flow

1. **`RolesGuard`** (also global) reads **`@Roles(...)`** metadata on handlers.
2. If roles are required, it compares **`req.user.role`** to the allowed list; otherwise **`ForbiddenException`**.
3. Handlers that do not set `@Roles` allow any authenticated role (subject to business logic in services).

## 4. Tenant isolation

- Controllers pass **`req.user.tenantId`** into services.
- Mongoose models for domain entities include **`tenantId`** and queries filter on it.
- Registration creates a new **`Organisation`** with a unique **`tenantId`** slug and links the first **`User`** as **admin**.

## 5. Data layer

- **`@nestjs/mongoose`** connects via **`MongooseModule.forRootAsync`** using **`DB_CONNECTION`** and **`DB_NAME`** from `ConfigModule`.
- Schemas live under `plutus-be/src/schema/` (e.g. `Contract`, `ITSystem`, `RenewalAlert`, `AuditLog`).
- **Audit** and **import** services write or read tenant-scoped documents as implemented in their modules.

## 6. Scheduled jobs

- **`ScheduleModule`** is imported in `AppModule`.
- **`RenewalCron`** triggers **`RenewalService.runDailyCron`** once per day to align renewal alerts with contract dates (implementation in `renewal` module).

## 7. Stripe (optional)

- **`StripeModule.forRootAsync`** builds the Stripe client from **`STRIPE_SK`** (placeholder allowed for boot).
- **`StripeController`** exposes public GET/DELETE routes for sessions/subscriptions used by billing UIs.
- Frontend uses **`@stripe/stripe-js`** and env keys from `.env.example` for client-side checkout where applicable.

## 8. Key files reference

| Concern | Location |
|---------|----------|
| Global guards | `plutus-be/src/app.module.ts` |
| Public routes | `@Public()` on controllers/handlers |
| HTTP client / token | `plutus-fe/src/lib/api-helper.ts` |
| Proxy base URL | `plutus-fe/src/lib/resolve-api-base-url.ts` |
| SWR fetcher | `plutus-fe/src/lib/swr-fetcher.ts` |
