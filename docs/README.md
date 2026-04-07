# Plutus documentation

This folder describes how the **Plutus** application is structured: a **Next.js** frontend (`plutus-fe`) and a **NestJS** API (`plutus-be`), backed by **MongoDB** and optional **Stripe** billing hooks.

| Document | What it covers |
|----------|----------------|
| [Architecture](./architecture.md) | High-level system diagram, tech stack, repos, versioning, multi-tenancy |
| [Features](./features.md) | Product areas mapped to routes and API domains |
| [Setup](./setup.md) | Local development, environment variables, running both apps |
| [Integration](./integration.md) | How the browser, Next.js proxy, API, and database connect |
| [Backend, auth & database](./backend-auth-database.md) | Nest modules, JWT, roles, Mongoose collections, cron, Swagger |

The backend API package is named `selle-backend` in its `package.json`; operationally we refer to it as the Plutus API.
