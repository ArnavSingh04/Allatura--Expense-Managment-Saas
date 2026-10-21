# Graph Report - plutus-fe  (2026-10-20)

## Corpus Check
- 159 files · ~53,197 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 2, .csv 2, .css 2)

## Summary
- 805 nodes · 1898 edges · 55 communities (37 shown, 18 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.84)
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
- AuthSessionContext.tsx
- expenses/page.tsx
- [id]/documents/page.tsx
- Feature breakdown
- DashboardAuthGate.tsx
- useAuthSession
- ApiError
- Login and authentication
- sideMenuStyles.tsx
- docs/README.md
- Backend, authentication, and database
- Codebase structure and how it works
- [...path]/route.ts
- VariationDialog.tsx
- System architecture
- How the parts integrate
- SupplierDialog.tsx
- Setup instructions
- DashboardTopbar.tsx
- Frontend — Auth0 & Platform Setup
- Allatura project
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
4. `authFetcher()` - 43 edges
5. `lucide-react` - 41 edges
6. `AppCard()` - 28 edges
7. `ApiError` - 28 edges
8. `swr` - 22 edges
9. `ApiHelper` - 21 edges
10. `keys` - 19 edges

## Surprising Connections (you probably didn't know these)
- `AuditPage()` --indirect_call--> `authFetcher()`  [INFERRED]
  src/app/dashboard/audit/page.tsx → src/lib/swr-fetcher.ts
- `CalendarPage()` --indirect_call--> `authFetcher()`  [INFERRED]
  src/app/dashboard/calendar/page.tsx → src/lib/swr-fetcher.ts
- `NewContractPage()` --indirect_call--> `authFetcher()`  [INFERRED]
  src/app/dashboard/projects/[id]/contracts/new/page.tsx → src/lib/swr-fetcher.ts
- `ProjectDetailLayout()` --indirect_call--> `authFetcher()`  [INFERRED]
  src/app/dashboard/projects/[id]/layout.tsx → src/lib/swr-fetcher.ts
- `ProjectRow()` --indirect_call--> `authFetcher()`  [INFERRED]
  src/app/dashboard/projects/page.tsx → src/lib/swr-fetcher.ts

## Import Cycles
- None detected.

## Communities (55 total, 18 thin omitted)

### Community 0 - "@mui/material"
Cohesion: 0.11
Nodes (39): lucide-react, @mui/material, react, swr, BudgetBar(), BudgetBarProps, Money(), Props (+31 more)

### Community 1 - "LandingPageClient.tsx"
Cohesion: 0.06
Nodes (36): next, bookDemoHref(), bookDemoIsExternal(), BrowserFrame(), BrowserFrameProps, DemoCommercialTable(), DemoCompanyOverview(), DemoRenewalsSnippet() (+28 more)

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
Cohesion: 0.16
Nodes (19): apiDelete(), apiGet(), apiPatch(), apiPost(), authHeaders(), extractErrorMessage(), request(), resolveApiBaseUrl() (+11 more)

### Community 7 - "import/page.tsx"
Cohesion: 0.10
Nodes (24): date-fns, react-big-calendar, AuditItem, AuditPage(), AuditResponse, CalendarApiEvent, CalendarPage(), CalendarResponse (+16 more)

### Community 8 - "construction.ts"
Cohesion: 0.09
Nodes (26): DraftDept, inSixMonths, NewProjectPage(), today, dashboardService, CreateProjectInput, UpdateProjectInput, CompanyOverview (+18 more)

### Community 9 - "settings/page.tsx"
Cohesion: 0.15
Nodes (17): @auth0/nextjs-auth0, createAllaturaTheme(), ThemeRegistry(), ThemeRegistryInner(), displayName(), initials(), SettingsPage(), notoSerif (+9 more)

### Community 10 - "money.ts"
Cohesion: 0.18
Nodes (17): PaymentClaimDialog(), Props, today(), PaymentClaimDrawer(), Props, NewContractPage(), addMoney(), formatMoneyCompact() (+9 more)

### Community 11 - "pending/page.tsx"
Cohesion: 0.17
Nodes (13): INVITE_ROLES, STATUS_COLOR, InviteLandingPage(), friendlyError(), OnboardingInner(), normalizeRole(), UserRole, Invitation (+5 more)

### Community 12 - "users/page.tsx"
Cohesion: 0.19
Nodes (9): statusColor(), UserRow, UsersContent(), UserStatus, matrix, RBAC_ACTIONS, ROLE_LABEL, ROLES (+1 more)

### Community 13 - "ApiHelper"
Cohesion: 0.07
Nodes (26): POST(), ExampleService, FrontendService, apiBaseUrl(), ApiHelper, authHeaders(), clearAuthToken(), cookieSecureSuffix() (+18 more)

### Community 14 - "mui-icons.d.ts"
Cohesion: 0.13
Nodes (14): @mui/icons-material/Add, @mui/icons-material/CalendarMonth, @mui/icons-material/CheckCircleRounded, @mui/icons-material/CloudUpload, @mui/icons-material/Dashboard, @mui/icons-material/Description, @mui/icons-material/Dns, @mui/icons-material/Edit (+6 more)

### Community 15 - "AuthSessionContext.tsx"
Cohesion: 0.12
Nodes (20): RequireAdmin(), ForbiddenPanel(), RoleGate(), RoleGateProps, AppSidebar(), AppSidebarProps, items, NavItem (+12 more)

### Community 16 - "expenses/page.tsx"
Cohesion: 0.19
Nodes (16): ExpenseDialog(), Props, today(), Money, CostLedgerRow, normalizeCostLedger(), NormalizedCostLedger, toMoney() (+8 more)

### Community 17 - "[id]/documents/page.tsx"
Cohesion: 0.21
Nodes (14): DocumentDropzone(), Props, DocumentGrid(), formatBytes(), pickIcon(), Props, CreateUploadUrlInput, documentService (+6 more)

### Community 18 - "Feature breakdown"
Cohesion: 0.17
Nodes (12): Audit log, Authentication and onboarding, Billing / plans (boilerplate), Contracts, Dashboard home and analytics, Feature breakdown, Import, IT systems (+4 more)

### Community 19 - "DashboardAuthGate.tsx"
Cohesion: 0.32
Nodes (3): DashboardAuthGate(), PendingApprovalScreen(), RejectedScreen()

### Community 20 - "useAuthSession"
Cohesion: 0.20
Nodes (18): useAuthSession(), DocumentsLibraryPage(), CompanyDashboardPage(), ProjectPaymentClaimsPage(), ProjectContractsPage(), ProjectDocumentsPage(), ProjectExpensesPage(), ProjectDetailLayout() (+10 more)

### Community 21 - "ApiError"
Cohesion: 0.21
Nodes (8): Props, SubcontractorDialog(), ContactPage(), friendlyError(), ApiError, ContactBody, submitContact(), subcontractorService

### Community 22 - "Login and authentication"
Cohesion: 0.11
Nodes (19): Backend (`plutus-be`), Client-only JWT read (not verified), Contents, Environment variables (auth-related), Frontend (`plutus-fe`), JWT validation (`passport-jwt`), Login, Login and authentication (+11 more)

### Community 25 - "sideMenuStyles.tsx"
Cohesion: 0.20
Nodes (9): sideMenuButtonAudit, sideMenuButtonCalendar, sideMenuButtonContracts, sideMenuButtonDashboard, sideMenuButtonImport, sideMenuButtonRenewals, sideMenuButtonSettings, sideMenuButtonSystems (+1 more)

### Community 27 - "Backend, authentication, and database"
Cohesion: 0.11
Nodes (18): Admin: create user (tenant provisioning), API documentation, Application bootstrap, Authentication stack, Backend, authentication, and database, Connection, Database (MongoDB + Mongoose), Environment (+10 more)

### Community 28 - "Codebase structure and how it works"
Cohesion: 0.22
Nodes (9): CI / automation, Codebase structure and how it works, Folder structure (overview), High level: two repositories, Low level: how the backend runs, Low level: how the frontend talks to the API, Mental model summary, `plutus-be` (NestJS backend) (+1 more)

### Community 30 - "[...path]/route.ts"
Cohesion: 0.31
Nodes (5): backendBase(), dynamic, proxy(), auth0, config

### Community 31 - "VariationDialog.tsx"
Cohesion: 0.27
Nodes (8): Props, VariationDialog(), CreateVariationInput, UpdateVariationInput, variationService, VARIATION_REASONS, VariationReason, VariationStatus

### Community 32 - "System architecture"
Cohesion: 0.25
Nodes (8): API surface, Background processing, Frontend networking, Multi-tenancy model, Optional integrations, Overview, Repositories, System architecture

### Community 33 - "How the parts integrate"
Cohesion: 0.22
Nodes (9): 1. Configuration chain, 2. Authentication flow, 3. Authorization flow, 4. Tenant isolation, 5. Data layer, 6. Scheduled jobs, 7. Stripe (optional), 8. Key files reference (+1 more)

### Community 34 - "SupplierDialog.tsx"
Cohesion: 0.32
Nodes (6): Props, SupplierDialog(), CreateSupplierInput, supplierService, UpdateSupplierInput, Supplier

### Community 35 - "Setup instructions"
Cohesion: 0.29
Nodes (7): 1. Backend (`plutus-be`), 2. Frontend (`plutus-fe`), 3. First-time user, 4. Production notes, 5. Troubleshooting, Prerequisites, Setup instructions

### Community 36 - "DashboardTopbar.tsx"
Cohesion: 0.27
Nodes (6): DashboardShell(), DashboardTopbar(), DashboardTopbarProps, titleFromPath(), titles, userInitials()

### Community 39 - "Frontend — Auth0 & Platform Setup"
Cohesion: 0.40
Nodes (4): Flows, Frontend — Auth0 & Platform Setup, How auth works here, Required env (`.env.local`)

### Community 40 - "Allatura project"
Cohesion: 0.40
Nodes (4): Allatura project, Environment variables, Getting Started, Learn More

### Community 42 - "3) Code Flow (Critical User Journeys)"
Cohesion: 0.50
Nodes (3): 3) Code Flow (Critical User Journeys), Flow A: Login to Dashboard, Flow B: Create Contract

### Community 43 - "next.config.js"
Cohesion: 0.40
Nodes (3): nextConfig, path, NOTE: /api/v1/* is handled by the auth-injecting route handler at

## Knowledge Gaps
- **328 isolated node(s):** `path`, `nextConfig`, `name`, `version`, `private` (+323 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 391 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@mui/material` connect `@mui/material` to `LandingPageClient.tsx`, `SupplierDialog.tsx`, `package.json`, `DashboardTopbar.tsx`, `billing/page.tsx`, `import/page.tsx`, `construction.ts`, `settings/page.tsx`, `money.ts`, `pending/page.tsx`, `users/page.tsx`, `AuthSessionContext.tsx`, `expenses/page.tsx`, `[id]/documents/page.tsx`, `DashboardAuthGate.tsx`, `ApiError`, `VariationDialog.tsx`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Why does `react` connect `@mui/material` to `LandingPageClient.tsx`, `SupplierDialog.tsx`, `package.json`, `DashboardTopbar.tsx`, `billing/page.tsx`, `import/page.tsx`, `construction.ts`, `settings/page.tsx`, `money.ts`, `pending/page.tsx`, `users/page.tsx`, `AuthSessionContext.tsx`, `expenses/page.tsx`, `[id]/documents/page.tsx`, `DashboardAuthGate.tsx`, `ApiError`, `VariationDialog.tsx`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `authFetcher()` (e.g. with `AuditPage()` and `CalendarPage()`) actually correct?**
  _`authFetcher()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **What connects `path`, `nextConfig`, `name` to the rest of the system?**
  _328 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `@mui/material` be split into smaller, more focused modules?**
  _Cohesion score 0.10789210789210789 - nodes in this community are weakly interconnected._
- **Should `LandingPageClient.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06352087114337568 - nodes in this community are weakly interconnected._