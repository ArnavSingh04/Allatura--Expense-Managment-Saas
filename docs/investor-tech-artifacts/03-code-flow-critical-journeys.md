# 3) Code Flow (Critical User Journeys)

## Flow A: Login to Dashboard

```mermaid
%%{init: {'theme':'base','themeVariables': {'fontSize':'16px','lineColor':'#0f172a','actorLineColor':'#0f172a','signalColor':'#0f172a','signalTextColor':'#0f172a','primaryColor':'#e2e8f0','primaryTextColor':'#0f172a','primaryBorderColor':'#334155'}}}%%
sequenceDiagram
  participant User
  participant FE as Next.js Login Page
  participant API as Nest Auth API
  participant DB as MongoDB
  participant Guard as Next Route Guard

  User->>FE: Submit email/password
  FE->>API: POST /v1/auth/login
  API->>DB: Validate user + password hash
  API-->>FE: JWT access token
  FE->>FE: Store token (localStorage + cookie)
  FE->>Guard: Navigate /dashboard
  Guard-->>FE: Allow if auth cookie exists
  FE->>API: Fetch dashboard data (Bearer token)
  API-->>FE: Tenant-scoped datasets
```

- User credentials are validated in backend auth service.
- Access token is generated and persisted client-side.
- Protected dashboard APIs then use bearer auth with tenant-aware responses.

## Flow B: Create Contract

```mermaid
%%{init: {'theme':'base','themeVariables': {'fontSize':'16px','lineColor':'#0f172a','actorLineColor':'#0f172a','signalColor':'#0f172a','signalTextColor':'#0f172a','primaryColor':'#e2e8f0','primaryTextColor':'#0f172a','primaryBorderColor':'#334155'}}}%%
sequenceDiagram
  participant User
  participant FE as Contracts UI
  participant API as Contract Controller
  participant SVC as Contract Service
  participant DB as MongoDB
  participant AUD as Audit Service

  User->>FE: Submit new contract form
  FE->>API: POST /v1/contracts (Bearer JWT)
  API->>SVC: Validate DTO + role + tenant context
  SVC->>DB: Verify related system in tenant
  SVC->>DB: Create contract document
  SVC->>AUD: Log Created event
  API-->>FE: Return created contract
```

- Contract creation is guarded by role checks.
- Service-layer validation prevents invalid tenant cross-linking.
- Audit entries provide traceability for critical writes.
