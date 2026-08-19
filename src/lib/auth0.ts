import { Auth0Client } from '@auth0/nextjs-auth0/server';

/**
 * Server-side Auth0 client (SDK v4).
 *
 * Configured from environment (allatura-dev locally, allatura-prod in prod):
 *   AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET
 *   AUTH0_SECRET       — 32-byte hex for cookie encryption (`openssl rand -hex 32`)
 *   APP_BASE_URL       — this app's origin (http://localhost:3000 in dev)
 *   AUTH0_AUDIENCE     — the backend API identifier, so login mints an access
 *                        token the Nest API accepts.
 *   AUTH0_SCOPE        — defaults to "openid profile email offline_access".
 *
 * The `offline_access` scope requests a refresh token so the session (and the
 * access token the proxy forwards to the backend) can be refreshed silently.
 */
export const auth0 = new Auth0Client({
  authorizationParameters: {
    scope: process.env.AUTH0_SCOPE || 'openid profile email offline_access',
    audience: process.env.AUTH0_AUDIENCE,
  },
});
