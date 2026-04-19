%%{init: {'theme':'base','themeVariables': {'fontSize':'16px','lineColor':'#0f172a','primaryColor':'#e2e8f0','primaryTextColor':'#0f172a','primaryBorderColor':'#334155','clusterBkg':'#f8fafc','clusterBorder':'#334155','tertiaryColor':'#ffffff'}}}%%
flowchart TD
  linkStyle default stroke:#0f172a,stroke-width:4px
  %% =========================
  %% LOGIN (PUBLIC) FLOW
  %% =========================
  A[User opens /login] --> B[Submit email+password<br/>src/app/login/page.tsx]
  B --> C[ApiHelper POST auth/login<br/>includeKey=false]
  C --> D[Request goes to /api/v1/auth/login<br/>or direct backend URL]

  D --> E{Next.js rewrite configured?}
  E -->|Yes| F[Next rewrites /api/v1/* -> BACKEND_API_URL(/v1)<br/>next.config.js]
  E -->|No / direct| G[NestJS API receives request<br/>POST /v1/auth/login]

  F --> G

  G --> H[@Public() route bypasses JwtAuthGuard]
  H --> I[AuthService.login]
  I --> I1[Normalize email (trim, toLowerCase)]
  I1 --> I2[Find User by email + populate organisationId]
  I2 --> J{User has passwordHash?}
  J -->|No| K[401-ish response: invalid credentials]
  J -->|Yes| L[bcrypt.compare(password, passwordHash)]
  L --> M{Password matches?}
  M -->|No| K
  M -->|Yes| N{Organisation has tenantId?}
  N -->|No| O[Fail (auth cannot proceed)]
  N -->|Yes| P[Sign JWT payload { sub, tenantId, role }<br/>JWT_SECRET + JWT_EXPIRES_IN (default 7d)]
  P --> Q[Return { accessToken, user }]

  Q --> R{Response includes accessToken?}
  R -->|No| S[Frontend shows: "Invalid email or password"]
  R -->|Yes| T[setAuthToken(accessToken)]
  T --> T1[Persist to localStorage key plutus_access_token]
  T1 --> T2[Mirror to cookie plutus_access_token<br/>path=/ SameSite=Lax max-age~7d]
  T2 --> U[window.location.assign('/dashboard')<br/>full navigation to avoid cookie race]

  %% =========================
  %% OPTIONAL SERVER-SIDE DASHBOARD GATE (NOT WIRED BY DEFAULT)
  %% =========================
  U --> V{Optional server-side guard wired as middleware.ts?}
  V -->|No| W[Dashboard loads (client-side)]
  V -->|Yes| X[src/proxy.ts checks cookie plutus_access_token]
  X --> Y{Cookie present?}
  Y -->|No| Z[Redirect to /login]
  Y -->|Yes| W

  %% =========================
  %% AUTHENTICATED API CALLS FLOW
  %% =========================
  W --> AA[UI calls /api/v1/... via ApiHelper or SWR authFetcher]
  AA --> AB[getStoredToken() reads localStorage]
  AB --> AC{Token exists?}
  AC -->|No| AD[No Authorization header sent<br/>(protected endpoints will 401)]
  AC -->|Yes| AE[Set Authorization: Bearer &lt;token&gt;]

  AA --> AF{includeKey true? (default)}
  AF -->|Yes| AG[If BACKEND_API_KEY set, add x-api-key header<br/>(Nest currently does not require)]
  AF -->|No| AH[Skip x-api-key]

  AE --> AI[Request hits Nest /v1/...]
  AD --> AI
  AG --> AI
  AH --> AI

  AI --> AJ[Global JwtAuthGuard runs]
  AJ --> AK[JwtStrategy extracts Bearer token]
  AK --> AL[Verify signature + expiry with JWT_SECRET]
  AL --> AM{Payload has sub, tenantId, role?}
  AM -->|No| AN[401 Unauthorized]
  AM -->|Yes| AO[req.user = { userId, tenantId, role }]

  AO --> AP[Global RolesGuard runs]
  AP --> AQ{Handler has @Roles(...) metadata?}
  AQ -->|No| AR[Allow (any authenticated user)]
  AQ -->|Yes| AS{req.user.role in allowed roles?}
  AS -->|No| AT[403 Forbidden]
  AS -->|Yes| AR

  AR --> AU[Controller/Service returns protected resource]
  AU --> AV[Browser renders data]

  %% =========================
  %% LOGOUT FLOW (CLIENT-SIDE)
  %% =========================
  AV --> LW[User clicks Logout (e.g., Settings)]
  LW --> LX[clearAuthToken()]
  LX --> LY[Remove localStorage token + expire cookie]
  LY --> LZ[Navigate to /login]
