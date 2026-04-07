# Feature breakdown

Features are grouped by **frontend routes** (Next.js App Router under `src/app`) and **backend controllers** (Nest, version `v1`).

## Authentication and onboarding

| Area | Frontend | Backend |
|------|----------|---------|
| Login | `/login` | `POST /v1/auth/login` |
| Register (org + admin user) | `/register` | `POST /v1/auth/register` |

JWT is returned from login and used for all protected routes.

## Dashboard home and analytics

| Area | Frontend | Backend |
|------|----------|---------|
| Dashboard shell | `/dashboard` | Aggregates via client calls |
| Spend / insights charts | `/dashboard` (and related) | `GET /v1/analytics/summary`, `spend-by-category`, `spend-by-vendor`, `insights` |

## IT systems

| Area | Frontend | Backend |
|------|----------|---------|
| List systems | `/dashboard/systems` | `GET /v1/systems` |
| New system | `/dashboard/systems/new` | `POST /v1/systems` (admin, editor) |
| Detail / edit | `/dashboard/systems/[id]`, `.../edit` | `GET/PATCH/DELETE /v1/systems/:id` |

Systems have category, department, criticality, vendor, and optional business/technical owners (user refs).

## Contracts

| Area | Frontend | Backend |
|------|----------|---------|
| List | `/dashboard/contracts` | `GET /v1/contracts` |
| New | `/dashboard/contracts/new` | `POST /v1/contracts` |
| Detail / edit | `/dashboard/contracts/[id]`, `.../edit` | `GET/PATCH/DELETE /v1/contracts/:id` |
| Calendar view | `/dashboard/calendar` | `GET /v1/contracts/calendar` (date range + filters) |

Contracts link to a system, store cost, billing cycle, renewal date, expense type, etc.

## Renewals

| Area | Frontend | Backend |
|------|----------|---------|
| Renewal list | `/dashboard/renewals` | `GET /v1/renewals` |
| Renewal detail / decision | `/dashboard/renewals/[id]` | `GET /v1/renewals/:id`, `PATCH /v1/renewals/:id/decision` |

Server-side cron updates renewal-related state on a daily schedule.

## Import

| Area | Frontend | Backend |
|------|----------|---------|
| CSV import UI | `/dashboard/import` | `POST /v1/import/preview`, `POST /v1/import/systems` (multipart) |

## Audit log

| Area | Frontend | Backend |
|------|----------|---------|
| Audit trail | `/dashboard/audit` | `GET /v1/audit` (filters + pagination) |

## Settings and users

| Area | Frontend | Backend |
|------|----------|---------|
| Settings | `/dashboard/settings` | Clears token; user APIs via `users` module |

User listing for the tenant: `GET /v1/users` (authenticated).

## Billing / plans (boilerplate)

| Area | Frontend | Backend |
|------|----------|---------|
| Plans | `/plans` | Stripe-related |
| Checkout success | `/checkout-success` | Stripe session handling (frontend + env) |

## Misc

| Area | Frontend | Backend |
|------|----------|---------|
| Form example | `/dashboard/form-example` | Demo UI |
| Global API | — | `GET /v1`, `GET /v1/health`; public **account** routes under `/v1/account` (legacy/billing helper) |

## Role matrix (API)

- **`@Roles('admin', 'editor')`** is used on mutating routes (create/update/delete) for systems, contracts, import, renewal decisions.
- **Viewers** can read lists and analytics where not restricted by controller logic.

See `RolesGuard` and per-controller decorators in `plutus-be/src`.
