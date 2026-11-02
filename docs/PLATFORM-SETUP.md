# Frontend platform setup

Use [local development setup](setup.md) for the frontend/backend commands and required environment values.

The shared [backend platform guide](../../plutus-be/docs/PLATFORM-SETUP.md) covers Auth0 applications, API audience and claims, plus optional email and storage providers. Keep the two repository folders next to each other when following that link.

For the current request flow, session handling and organisation selection, see [login and sessions](LOGIN_AND_AUTH.md) and [integration](integration.md). The application domain clients call the same-origin proxy, which obtains the access token on the server. Auth0 SDK routes and their exposure remain part of the SDK configuration; this client pattern is not a guarantee that no browser-accessible token endpoint exists.

Provider setup must use the values from the intended environment. Example domains and bucket names do not establish that those resources exist or have been validated.
