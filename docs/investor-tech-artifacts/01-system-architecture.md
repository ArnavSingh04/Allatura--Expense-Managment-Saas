# 1) System Architecture Diagram

```mermaid
%%{init: {'theme':'base','themeVariables': {'fontSize':'16px','lineColor':'#0f172a','primaryColor':'#e2e8f0','primaryTextColor':'#0f172a','primaryBorderColor':'#334155','clusterBkg':'#f8fafc','clusterBorder':'#334155','tertiaryColor':'#ffffff'}}}%%
flowchart LR
  linkStyle default stroke:#0f172a,stroke-width:4px

  U[End User] --> FE[Next.js Web App<br/>React 19 + App Router]
  FE -->|HTTPS /api/v1/*| BE[NestJS v1 REST API<br/>Modular Monolith]
  FE -->|Stripe Checkout / Webhooks| STRIPE[Stripe]

  BE -->|Mongoose| DB[(MongoDB)]
  BE -->|Stripe SDK| STRIPE

  subgraph FE_MOD[Frontend Modules]
    FE1[Dashboard UI]
    FE2[Auth Pages]
    FE3[SWR Data Fetching]
    FE4[Route Proxy Guard]
  end

  FE --- FE_MOD

  subgraph BE_MOD[Backend Modules]
    B1[Auth + JWT + Roles]
    B2[Systems]
    B3[Contracts]
    B4[Renewals + Cron]
    B5[Analytics]
    B6[Import CSV]
    B7[Audit Log]
    B8[Account/Billing]
  end

  BE --- BE_MOD
```

- Frontend is a Next.js web app using App Router, SWR, and authenticated `fetch`.
- Backend is a NestJS modular monolith exposing versioned REST APIs.
- Data is persisted in MongoDB via Mongoose schemas.
- Stripe is integrated for checkout, sessions, and subscription workflows.
- Communication is HTTP/HTTPS REST (no WebSocket or MQTT usage found).
