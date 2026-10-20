# Graph Report - plutus-fe  (2026-10-20)

## Corpus Check
- 158 files · ~53,156 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 2, .csv 2, .css 2)

## Summary
- 804 nodes · 1922 edges · 61 communities (42 shown, 19 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `df65f72d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- @mui/material
- LandingPageClient.tsx
- billing/page.tsx
- package.json
- dependencies
- compilerOptions
- api-client.ts
- import/page.tsx
- construction.ts
- settings/page.tsx
- money.ts
- pending/page.tsx
- users/page.tsx
- ApiHelper
- mui-icons.d.ts
- AppSidebar.tsx
- ExpenseDialog.tsx
- jwt.ts
- Feature breakdown
- DashboardAuthGate.tsx
- contractService.ts
- api-helper.ts
- Login and authentication
- AuthSessionContext.tsx
- REQUEST_TYPE
- sideMenuStyles.tsx
- docs/README.md
- Backend, authentication, and database
- Codebase structure and how it works
- ExampleService
- [...path]/route.ts
- VariationDialog.tsx
- System architecture
- Contract
- SupplierDialog.tsx
- Setup instructions
- DashboardTopbar.tsx
- Frontend (`plutus-fe`)
- Feature modules (REST)
- Frontend — Auth0 & Platform Setup
- Allatura project
- Authentication stack
- 3) Code Flow (Critical User Journeys)
- next.config.js
- Allatura Investor Technical Artifacts
- auth-events.ts
- 01-system-architecture.md
- 02-detailed-technical-design.md
- 04-authentication-flow.md
- 05-database-data-model.md
- 06-current-limitations.md
- 07-future-architecture-vision.md
- 08-investor-friendly-summary.md
- auth-jwt-contract.ts
- layoutStyles.tsx
- profileStyles.tsx

## God Nodes (most connected - your core abstractions)
1. `@mui/material` - 73 edges
2. `useAuthSession()` - 59 edges
3. `react` - 54 edges
4. `authFetcher()` - 45 edges
5. `lucide-react` - 41 edges
6. `ApiHelper` - 30 edges
7. `AppCard()` - 28 edges
8. `ApiError` - 28 edges
9. `swr` - 22 edges
10. `keys` - 19 edges

## Surprising Connections (you probably didn't know these)
- `How auth works here` --references--> `AuthSessionProvider()`  [INFERRED]
  docs/PLATFORM-SETUP.md → src/app/contexts/AuthSessionContext.tsx
- `Logout` --references--> `clearAuthToken()`  [INFERRED]
  docs/LOGIN_AND_AUTH.md → src/lib/api-helper.ts
- `Repositories` --references--> `ApiHelper`  [INFERRED]
  docs/architecture.md → src/lib/api-helper.ts
- `Low level: how the frontend talks to the API` --references--> `ApiHelper`  [INFERRED]
  docs/CODEBASE_STRUCTURE.md → src/lib/api-helper.ts
- `Mental model summary` --references--> `ApiHelper`  [INFERRED]
  docs/CODEBASE_STRUCTURE.md → src/lib/api-helper.ts

## Import Cycles
- None detected.

## Communities (61 total, 19 thin omitted)

### Community 0 - "@mui/material"
Cohesion: 0.07
Nodes (71): lucide-react, @mui/material, react, swr, BudgetBar(), BudgetBarProps, DocumentDropzone(), Props (+63 more)

### Community 1 - "LandingPageClient.tsx"
Cohesion: 0.07
Nodes (35): next, bookDemoHref(), bookDemoIsExternal(), BrowserFrame(), BrowserFrameProps, DemoCommercialTable(), DemoCompanyOverview(), DemoRenewalsSnippet() (+27 more)

### Community 2 - "billing/page.tsx"
Cohesion: 0.08
Nodes (25): PlanCard(), planProps, BillingInner(), FEATURE_ROWS, fmtDate(), fmtLimit(), fmtPrice(), friendlyError() (+17 more)

### Community 3 - "package.json"
Cohesion: 0.05
Nodes (38): devDependencies, @svgr/webpack, @types/react-big-calendar, name, private, scripts, build, dev (+30 more)

### Community 4 - "dependencies"
Cohesion: 0.06
Nodes (35): dependencies, ai, @auth0/nextjs-auth0, autoprefixer, date-fns, @emotion/cache, @emotion/react, @emotion/styled (+27 more)

### Community 5 - "compilerOptions"
Cohesion: 0.06
Nodes (32): compilerOptions, allowJs, baseUrl, esModuleInterop, forceConsistentCasingInFileNames, ignoreDeprecations, incremental, isolatedModules (+24 more)

### Community 6 - "api-client.ts"
Cohesion: 0.13
Nodes (23): ContactPage(), friendlyError(), apiDelete(), apiGet(), apiPatch(), apiPost(), authHeaders(), extractErrorMessage() (+15 more)

### Community 7 - "import/page.tsx"
Cohesion: 0.10
Nodes (24): date-fns, react-big-calendar, AuditItem, AuditPage(), AuditResponse, CalendarApiEvent, CalendarPage(), CalendarResponse (+16 more)

### Community 8 - "construction.ts"
Cohesion: 0.10
Nodes (24): DraftDept, inSixMonths, today, dashboardService, CreateProjectInput, projectService, UpdateProjectInput, CompanyOverview (+16 more)

### Community 9 - "settings/page.tsx"
Cohesion: 0.14
Nodes (18): @auth0/nextjs-auth0, createAllaturaTheme(), notoSerif, plusJakarta, ThemeRegistry(), ThemeRegistryInner(), displayName(), initials() (+10 more)

### Community 10 - "money.ts"
Cohesion: 0.16
Nodes (18): PaymentClaimDialog(), Props, today(), PaymentClaimDrawer(), Props, VariationDialog(), NewContractPage(), NewProjectPage() (+10 more)

### Community 11 - "pending/page.tsx"
Cohesion: 0.18
Nodes (11): INVITE_ROLES, STATUS_COLOR, friendlyError(), OnboardingInner(), UserRole, Invitation, invitationService, InvitationStatus (+3 more)

### Community 12 - "users/page.tsx"
Cohesion: 0.19
Nodes (11): statusColor(), UserRow, UsersContent(), UserStatus, InviteLandingPage(), matrix, normalizeRole(), RBAC_ACTIONS (+3 more)

### Community 13 - "ApiHelper"
Cohesion: 0.24
Nodes (4): Sending the token on API calls, ApiHelper, authHeaders(), getStoredToken()

### Community 14 - "mui-icons.d.ts"
Cohesion: 0.13
Nodes (14): @mui/icons-material/Add, @mui/icons-material/CalendarMonth, @mui/icons-material/CheckCircleRounded, @mui/icons-material/CloudUpload, @mui/icons-material/Dashboard, @mui/icons-material/Description, @mui/icons-material/Dns, @mui/icons-material/Edit (+6 more)

### Community 15 - "AppSidebar.tsx"
Cohesion: 0.18
Nodes (10): RequireAdmin(), ForbiddenPanel(), RoleGate(), RoleGateProps, AppSidebar(), AppSidebarProps, items, NavItem (+2 more)

### Community 16 - "ExpenseDialog.tsx"
Cohesion: 0.23
Nodes (11): ExpenseDialog(), Props, today(), CreateExpenseInput, expenseService, UpdateExpenseInput, Expense, EXPENSE_KINDS (+3 more)

### Community 17 - "jwt.ts"
Cohesion: 0.26
Nodes (9): base64UrlDecode(), decodeJwtPayloadJson(), getJwtClaims(), getJwtSubject(), JwtClaims, AccessTokenClaims, asRole(), asStatus() (+1 more)

### Community 18 - "Feature breakdown"
Cohesion: 0.17
Nodes (12): Audit log, Authentication and onboarding, Billing / plans (boilerplate), Contracts, Dashboard home and analytics, Feature breakdown, Import, IT systems (+4 more)

### Community 19 - "DashboardAuthGate.tsx"
Cohesion: 0.23
Nodes (4): DashboardAuthGate(), PendingApprovalScreen(), RejectedScreen(), DashboardShell()

### Community 20 - "contractService.ts"
Cohesion: 0.18
Nodes (10): Money, CostLedgerRow, normalizeCostLedger(), NormalizedCostLedger, toMoney(), contractService, CreateContractInput, MilestoneInput (+2 more)

### Community 21 - "api-helper.ts"
Cohesion: 0.27
Nodes (8): 1. Configuration chain, 2. Authentication flow, References, apiBaseUrl(), clearAuthToken(), cookieSecureSuffix(), setAuthToken(), resolveApiBaseUrl()

### Community 22 - "Login and authentication"
Cohesion: 0.18
Nodes (11): Backend (`plutus-be`), Contents, Environment variables (auth-related), JWT validation (`passport-jwt`), Login, Login and authentication, Logout, Overview (+3 more)

### Community 23 - "AuthSessionContext.tsx"
Cohesion: 0.24
Nodes (10): AuthLoadError, AuthSession, AuthSessionContext, AuthSessionContextValue, AuthSessionProvider(), isTransientAuthMeFailure(), loadAuthMe(), MeResponse (+2 more)

### Community 24 - "REQUEST_TYPE"
Cohesion: 0.27
Nodes (7): FrontendService, REQUEST_TYPE, DELETE, GET, PATCH, POST, submitRequest()

### Community 25 - "sideMenuStyles.tsx"
Cohesion: 0.20
Nodes (9): sideMenuButtonAudit, sideMenuButtonCalendar, sideMenuButtonContracts, sideMenuButtonDashboard, sideMenuButtonImport, sideMenuButtonRenewals, sideMenuButtonSettings, sideMenuButtonSystems (+1 more)

### Community 27 - "Backend, authentication, and database"
Cohesion: 0.22
Nodes (9): API documentation, Application bootstrap, Backend, authentication, and database, Connection, Database (MongoDB + Mongoose), Main collections (schemas), Scheduling, Security notes for operators (+1 more)

### Community 28 - "Codebase structure and how it works"
Cohesion: 0.22
Nodes (9): CI / automation, Codebase structure and how it works, Folder structure (overview), High level: two repositories, Low level: how the backend runs, Low level: how the frontend talks to the API, Mental model summary, `plutus-be` (NestJS backend) (+1 more)

### Community 29 - "ExampleService"
Cohesion: 0.36
Nodes (3): POST(), ExampleService, toResponse()

### Community 30 - "[...path]/route.ts"
Cohesion: 0.31
Nodes (5): backendBase(), dynamic, proxy(), auth0, config

### Community 31 - "VariationDialog.tsx"
Cohesion: 0.31
Nodes (7): Props, CreateVariationInput, UpdateVariationInput, variationService, VARIATION_REASONS, VariationReason, VariationStatus

### Community 32 - "System architecture"
Cohesion: 0.25
Nodes (8): API surface, Background processing, Frontend networking, Multi-tenancy model, Optional integrations, Overview, Repositories, System architecture

### Community 33 - "Contract"
Cohesion: 0.25
Nodes (8): 3. Authorization flow, 4. Tenant isolation, 5. Data layer, 6. Scheduled jobs, 7. Stripe (optional), 8. Key files reference, How the parts integrate, Contract

### Community 34 - "SupplierDialog.tsx"
Cohesion: 0.32
Nodes (6): Props, SupplierDialog(), CreateSupplierInput, supplierService, UpdateSupplierInput, Supplier

### Community 35 - "Setup instructions"
Cohesion: 0.29
Nodes (7): 1. Backend (`plutus-be`), 2. Frontend (`plutus-fe`), 3. First-time user, 4. Production notes, 5. Troubleshooting, Prerequisites, Setup instructions

### Community 36 - "DashboardTopbar.tsx"
Cohesion: 0.43
Nodes (5): DashboardTopbar(), DashboardTopbarProps, titleFromPath(), titles, userInitials()

### Community 37 - "Frontend (`plutus-fe`)"
Cohesion: 0.33
Nodes (6): Client-only JWT read (not verified), Frontend (`plutus-fe`), Login page, Optional server-side route guard, Routing the browser to the API, Token storage and clearing

### Community 38 - "Feature modules (REST)"
Cohesion: 0.40
Nodes (5): Admin: create user (tenant provisioning), Feature modules (REST), Tenant and role guard enforcement, User role management contract, Why new users see “Invalid credentials” on login

### Community 39 - "Frontend — Auth0 & Platform Setup"
Cohesion: 0.40
Nodes (4): Flows, Frontend — Auth0 & Platform Setup, How auth works here, Required env (`.env.local`)

### Community 40 - "Allatura project"
Cohesion: 0.40
Nodes (4): Allatura project, Environment variables, Getting Started, Learn More

### Community 41 - "Authentication stack"
Cohesion: 0.50
Nodes (4): Authentication stack, Environment, JWT contents, Login response (`POST /v1/auth/login`)

### Community 42 - "3) Code Flow (Critical User Journeys)"
Cohesion: 0.50
Nodes (3): 3) Code Flow (Critical User Journeys), Flow A: Login to Dashboard, Flow B: Create Contract

## Knowledge Gaps
- **317 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `dev` (+312 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 379 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@mui/material` connect `@mui/material` to `LandingPageClient.tsx`, `SupplierDialog.tsx`, `package.json`, `DashboardTopbar.tsx`, `billing/page.tsx`, `api-client.ts`, `import/page.tsx`, `construction.ts`, `settings/page.tsx`, `money.ts`, `pending/page.tsx`, `users/page.tsx`, `AppSidebar.tsx`, `ExpenseDialog.tsx`, `DashboardAuthGate.tsx`, `VariationDialog.tsx`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Why does `react` connect `@mui/material` to `LandingPageClient.tsx`, `SupplierDialog.tsx`, `package.json`, `billing/page.tsx`, `api-client.ts`, `import/page.tsx`, `construction.ts`, `settings/page.tsx`, `money.ts`, `pending/page.tsx`, `users/page.tsx`, `AppSidebar.tsx`, `ExpenseDialog.tsx`, `DashboardAuthGate.tsx`, `AuthSessionContext.tsx`, `VariationDialog.tsx`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **Why does `ApiHelper` connect `ApiHelper` to `System architecture`, `Frontend (`plutus-fe`)`, `users/page.tsx`, `api-helper.ts`, `Login and authentication`, `REQUEST_TYPE`, `Codebase structure and how it works`, `ExampleService`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `authFetcher()` (e.g. with `Sending the token on API calls` and `Token storage and clearing`) actually correct?**
  _`authFetcher()` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _317 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `@mui/material` be split into smaller, more focused modules?**
  _Cohesion score 0.07338638373121131 - nodes in this community are weakly interconnected._
- **Should `LandingPageClient.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06623376623376623 - nodes in this community are weakly interconnected._