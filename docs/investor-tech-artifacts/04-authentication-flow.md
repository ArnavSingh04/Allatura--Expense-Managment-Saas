# 4) Authentication Flow

```mermaid
%%{init: {'theme':'base','themeVariables': {'fontSize':'16px','lineColor':'#0f172a','actorLineColor':'#0f172a','signalColor':'#0f172a','signalTextColor':'#0f172a','primaryColor':'#e2e8f0','primaryTextColor':'#0f172a','primaryBorderColor':'#334155'}}}%%
sequenceDiagram
  participant U as User
  participant FE as Frontend
  participant AUTH as AuthService
  participant JWT as JwtStrategy and Guards
  participant API as Protected API

  U->>FE: Login or Register
  FE->>AUTH: /auth/register or /auth/login
  AUTH-->>FE: Access JWT (sub, tenantId, role)
  FE->>FE: Persist token + send Authorization header
  FE->>API: Request protected endpoint
  API->>JWT: Validate token + extract claims
  JWT-->>API: req.user = { userId, tenantId, role }
  API->>API: Enforce @Roles where applied
  API-->>FE: Tenant-filtered response
```

- Authentication uses JWT bearer tokens.
- Backend applies JWT guard globally and allows explicit `@Public` routes.
- Authorization uses role guards on selected mutation endpoints.
- Tenant isolation is achieved by carrying `tenantId` in JWT and scoping queries.
- Current implementation returns access token only (no refresh token lifecycle).
