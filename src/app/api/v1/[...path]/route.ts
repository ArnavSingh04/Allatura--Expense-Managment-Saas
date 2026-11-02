import type { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { ACTIVE_ORGANISATION_COOKIE, isOrganisationId, readActiveOrganisation } from '@/lib/active-organisation-cookie';
import { isOrganisationIndependentPath } from '@/lib/organisation-routing';

export const dynamic = 'force-dynamic';

/**
 * Same-origin proxy for the Nest backend.
 *
 * Browser requests use the session cookie without supplying a Bearer token.
 * This handler obtains the token through the server-side Auth0 SDK and attaches
 * it to the backend request. Calls without a token are still forwarded so
 * public endpoints remain available; the backend rejects protected requests.
 */
function backendBase(): string {
  const base =
    process.env.BACKEND_API_URL ||
    process.env.INTERNAL_BACKEND_URL ||
    // 127.0.0.1 (IPv4), not localhost: Node fetch may pick IPv6 ::1 while the
    // backend binds 0.0.0.0 (IPv4 only), which surfaces as backend_unreachable.
    'http://127.0.0.1:3001/v1';
  return base.replace(/\/$/, '');
}

async function proxy(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await ctx.params;
  const method = req.method.toUpperCase();
  const target = `${backendBase()}/${(path || []).join('/')}${req.nextUrl.search}`;

  // Forward only supported request metadata. Browser-supplied authorisation
  // and tenant headers must not replace the session token or organisation binding.
  const headers = new Headers();
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  const accept = req.headers.get('accept');
  if (accept) headers.set('accept', accept);

  if (!isOrganisationIndependentPath((path || []).join('/'))) {
    const session = await auth0.getSession().catch(() => null);
    const subject = session?.user.sub;
    if (subject) {
      const explicit = req.headers.get('x-organisation-id');
      const preference = readActiveOrganisation(req.cookies.get(ACTIVE_ORGANISATION_COOKIE)?.value, subject);
      if ((explicit !== null && !isOrganisationId(explicit)) || (explicit === null && preference.invalid)) {
        return Response.json({ message: 'invalid_organisation' }, { status: 403 });
      }
      // The tab's explicit binding wins over a cookie changed by another tab.
      const organisationId = explicit ?? preference.organisationId;
      // Selection is not authority: the backend verifies membership for every request.
      if (organisationId) headers.set('x-organisation-id', organisationId);
    }
  }

  try {
    const { token } = await auth0.getAccessToken();
    if (token) headers.set('authorization', `Bearer ${token}`);
  } catch (err) {
    // Missing sessions are expected on public routes. Log other SDK error codes
    // to distinguish token refresh failures from ordinary anonymous requests.
    // A missing refresh token can require Auth0 Offline Access configuration
    // and a new sign-in; the error code is needed to diagnose the actual cause.
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
  const disposition = upstream.headers.get('content-disposition');
  if (disposition) resHeaders.set('content-disposition', disposition);
  const buf = await upstream.arrayBuffer();
  // Response forbids a body for these statuses, including an empty ArrayBuffer.
  return new Response([204, 205, 304].includes(upstream.status) ? null : buf, { status: upstream.status, headers: resHeaders });
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
};
