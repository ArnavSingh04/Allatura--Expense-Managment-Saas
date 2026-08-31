import type { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';

export const dynamic = 'force-dynamic';

/**
 * Same-origin proxy for the Nest backend.
 *
 * The browser calls `/api/v1/*` with no credentials in JS. This handler reads
 * the Auth0 access token from the encrypted session cookie (server-side only)
 * and forwards it to the backend as a Bearer token, so the access token is
 * never exposed to client JavaScript. Unauthenticated calls (e.g. the public
 * invitation lookup) are forwarded without a token.
 */
function backendBase(): string {
  const base =
    process.env.BACKEND_API_URL ||
    process.env.INTERNAL_BACKEND_URL ||
    'http://localhost:3001/v1';
  return base.replace(/\/$/, '');
}

async function proxy(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await ctx.params;
  const method = req.method.toUpperCase();
  const target = `${backendBase()}/${(path || []).join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  const accept = req.headers.get('accept');
  if (accept) headers.set('accept', accept);

  try {
    const { token } = await auth0.getAccessToken();
    if (token) headers.set('authorization', `Bearer ${token}`);
  } catch (err) {
    // Two very different cases end up here, and conflating them silently is what
    // made "session expired" impossible to diagnose:
    //   1. No session at all — an anonymous call to a public route (fine).
    //   2. There IS a session, but the access token can't be produced — almost
    //      always because it expired and NO refresh token was issued. That
    //      happens when the Auth0 API ("https://api.allatura.app") has
    //      "Allow Offline Access" turned OFF, so `offline_access` is stripped
    //      from the grant. The request is then forwarded without a Bearer and
    //      the backend answers 401, which the UI renders as
    //      "your session has expired". Enable Allow Offline Access to fix it.
    // We forward unauthenticated either way (public routes must keep working),
    // but we log case 2 loudly so it is not a silent failure.
    const code = (err as { code?: string })?.code;
    if (code && code !== 'missing_session') {
      console.warn(
        `[api-proxy] Could not attach an access token (code=${code}) for ` +
          `${method} /${(path || []).join('/')}. If this is "missing_refresh_token"/` +
          `"session_expired", enable "Allow Offline Access" on the Auth0 API so a ` +
          `refresh token is issued; existing users must sign in once more.`,
      );
    }
  }

  const body =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : Buffer.from(await req.arrayBuffer());

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body,
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch {
    return new Response(
      JSON.stringify({ message: 'backend_unreachable' }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    );
  }

  const resHeaders = new Headers();
  const resType = upstream.headers.get('content-type');
  if (resType) resHeaders.set('content-type', resType);
  const buf = await upstream.arrayBuffer();
  return new Response(buf, { status: upstream.status, headers: resHeaders });
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
};
