# Frontend documentation

Start with the [repository README](../README.md), then use the guides below for the current implementation.

## Current guides

| Guide | Purpose |
| --- | --- |
| [Developer handover](HANDOVER.md) | Source map, conventions, important contracts and known limits |
| [Local setup](setup.md) | Run the paired applications and isolated checks |
| [Login and sessions](LOGIN_AND_AUTH.md) | Auth0, onboarding, membership and organisation selection |
| [Integration](integration.md) | API proxy, clients, cache invalidation and shared contracts |
| [Platform setup](PLATFORM-SETUP.md) | Link to the shared provider configuration guide |
| [Frontend tests](../qa/frontend-testing.md) | Test scope, recorded results and limitations |
| [CI and system tests](../qa/ci/README.md) | Local commands, private backend checkout and workflow checks |
| [Backend handover](../../plutus-be/docs/HANDOVER.md) | API responsibilities and cross-repository changes |

Cross-repository links assume `plutus-fe` and `plutus-be` are siblings. The backend package retains the legacy name `selle-backend`; it is the Allatura API.

## Historical design and presentation material

The following files retain earlier designs and product terminology. Their password-login, local-token, module and route descriptions are not the current implementation:

- [Earlier codebase structure](CODEBASE_STRUCTURE.md)
- [Earlier architecture](architecture.md)
- [Earlier feature map](features.md)
- [Earlier backend/authentication notes](backend-auth-database.md)
- [Earlier login flowchart](flowchart.md)

[Investor technical material](investor-tech-artifacts/README.md), the [presentation](presentation/README.md) and `graphify-out/` are snapshots. Confirm technical and deployment claims against the current source and recorded evidence before reusing them. Generated source-analysis caches are excluded; recorded graph reports remain available.

Historical QA records keep their original dates and revisions. They are not automatically evidence for the current working tree.
