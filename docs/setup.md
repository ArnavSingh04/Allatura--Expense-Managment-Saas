# Setup instructions

## Prerequisites

- **Node.js** (compatible with Next 16 / Nest 11; LTS recommended)
- **MongoDB** reachable URI (e.g. MongoDB Atlas)
- Two terminals (or processes): one for **plutus-be**, one for **plutus-fe**

## 1. Backend (`plutus-be`)

```bash
cd plutus-be
npm install
```

Copy environment variables:

```bash
# Create .env from the example in the repo
cp .env.example .env
```

Edit **`.env`**:

| Variable | Purpose |
|----------|---------|
| `DB_CONNECTION` | MongoDB connection string (**required**; app throws if missing) |
| `DB_NAME` | Database name |
| `APP_PORT` or `PORT` | Listen port (default **3001** in code if unset) |
| `JWT_SECRET` | Signing key for access tokens |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `STRIPE_SK` | Optional; Stripe secret for billing routes |

Start in development (webpack HMR):

```bash
npm run start:dev
```

Confirm: logs show `backend listening on` your port; open **`http://localhost:3001/api`** for Swagger.

## 2. Frontend (`plutus-fe`)

```bash
cd plutus-fe
npm install
```

Copy **`.env.example`** to **`.env.local`** and adjust:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | Public site URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_BACKEND_API_URL` | Must end with **`/v1`** (e.g. `http://localhost:3001/v1`) |
| `BACKEND_API_URL` | Target for **Next.js rewrites** (`/api/v1` → backend); same `/v1` path |
| `BACKEND_API_KEY` | Optional `x-api-key` header for legacy/server use |
| Stripe keys | If you use checkout flows |

Start Next.js:

```bash
npm run dev
```

Open **`http://localhost:3000`**.

## 3. First-time user

1. Use **`/register`** to create an organisation and admin user.
2. Log in via **`/login`**; the app stores the JWT and calls **`/v1/*`** with `Authorization: Bearer ...`.

## 4. Production notes

- **Frontend**: `next build` / `next start`; set `NEXT_PUBLIC_*` and `BACKEND_API_URL` in the hosting provider.
- **Backend**: `npm run build` then `npm run start:prod`; set `PORT`, `DB_*`, `JWT_*`, Stripe as needed.
- **CORS**: backend enables CORS globally; for browsers hitting a **different origin**, ensure origins are acceptable or prefer the **same-origin** `/api/v1` proxy pattern from the Next deployment.

## 5. Troubleshooting

| Symptom | Check |
|---------|--------|
| `DB_CONNECTION is missing` | `.env` in `plutus-be` with valid `DB_CONNECTION` |
| Frontend “API URL is not configured” | `NEXT_PUBLIC_BACKEND_API_URL` in `.env.local`, restart `next dev` |
| CORS / failed fetch on localhost | Use `/api/v1` proxy: set env so browser uses same origin (see `resolve-api-base-url.ts`) |
| 401 on API calls | Token missing or expired; log in again from `/login` |
