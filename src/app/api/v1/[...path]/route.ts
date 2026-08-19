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
  const target = `${backendBase()}/${(path || []).join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  const accept = req.headers.get('accept');
  if (accept) headers.set('accept', accept);

  try {
    const { token } = await auth0.getAccessToken();
    if (token) headers.set('authorization', `Bearer ${token}`);
  } catch {
    // No active session — forward unauthenticated (public routes still work;
    // protected routes will return 401 from the backend).
  }

  const method = req.method.toUpperCase();
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
