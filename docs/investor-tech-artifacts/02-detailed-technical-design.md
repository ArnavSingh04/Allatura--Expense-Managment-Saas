# 2) Detailed Technical Design (Current State)

- **Frontend modules:** auth pages, dashboard domains (systems, contracts, renewals, analytics, import, audit), and shared API helpers.
- **Backend modules:** `auth`, `user`, `account`, `system`, `contract`, `renewal`, `analytics`, `import`, `audit`, `stripe`.
- **Core pattern:** controller -> service -> Mongoose model, with guard-based security and audit logging on major mutations.
- **Architecture style:** modular monolith with tenant-aware filtering using `tenantId` from JWT claims.
- **Scheduling:** renewal processing includes cron-driven scanning and alert/decision lifecycle updates.

```mermaid
%%{init: {'theme':'base','themeVariables': {'fontSize':'16px','lineColor':'#0f172a','primaryColor':'#e2e8f0','primaryTextColor':'#0f172a','primaryBorderColor':'#334155','clusterBkg':'#f8fafc','clusterBorder':'#334155','tertiaryColor':'#ffffff'}}}%%
flowchart TD
  linkStyle default stroke:#0f172a,stroke-width:4px

  UI[UI Action] --> FH[Frontend API Helper]
  FH --> C[Nest Controller]
  C --> G[JWT and Role Guards]
  G --> S[Domain Service]
  S --> M[Mongoose Model]
  M --> DB[(MongoDB)]
  S --> A[Audit Service]
```
