# Allatura project
This is the main repository 

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

Install Dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

## Environment variables

Copy `.env.example` to `.env.local` for local development.

**Local `.env.local` (typical)**

- `NEXT_PUBLIC_APP_URL`, frontend origin, e.g. `http://localhost:3000`
- `NEXT_PUBLIC_BACKEND_API_URL`, API base **including `/v1`**, e.g. `http://localhost:3001/v1`
- `BACKEND_API_URL`, same as above for server-side calls (optional if `NEXT_PUBLIC_BACKEND_API_URL` is set)

**Deploying the frontend**

Set these in your hosting provider (Vercel, Cloud Run, etc.) **before the production build**. `NEXT_PUBLIC_*` values are baked in at build time.

| Variable | Production value |
|----------|------------------|
| `NEXT_PUBLIC_APP_URL` | Your live frontend URL (e.g. `https://your-app.vercel.app`) |
| `NEXT_PUBLIC_BACKEND_API_URL` | `https://plutus-api-462298977190.us-central1.run.app/v1` |
| `BACKEND_API_URL` | Same as `NEXT_PUBLIC_BACKEND_API_URL` |

Stripe and other secrets from `.env.example` still apply where you use checkout/webhooks.

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!
