import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import {
  ACTIVE_ORGANISATION_COOKIE,
  encodeActiveOrganisation,
  isOrganisationId,
} from '@/lib/active-organisation-cookie';

export const dynamic = 'force-dynamic';

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const origin = req.headers.get('origin');
  if (origin && origin !== req.nextUrl.origin) return json({ message: 'invalid_origin' }, 403);

  const session = await auth0.getSession().catch(() => null);
  const subject = session?.user.sub;
  if (!subject) return json({ message: 'unauthorized' }, 401);

  let organisationId: unknown;
  try {
    organisationId = (await req.json())?.organisationId;
  } catch {
    return json({ message: 'invalid_organisation' }, 400);
  }
  if (organisationId !== null && !isOrganisationId(organisationId)) {
    return json({ message: 'invalid_organisation' }, 400);
  }

  if (organisationId !== null) {
    let token: string;
    try {
      token = (await auth0.getAccessToken()).token;
    } catch {
      return json({ message: 'session_expired' }, 401);
    }
    const base = (
      process.env.BACKEND_API_URL ||
      process.env.INTERNAL_BACKEND_URL ||
      'http://127.0.0.1:3001/v1'
    ).replace(/\/$/, '');
    let response: Response;
    try {
      // Discovery must not carry the old preference: it may no longer be valid.
      response = await fetch(`${base}/auth/organisations`, {
        headers: { authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      return json({ message: 'backend_unreachable' }, 502);
    }
    if (!response.ok) return json({ message: 'organisation_selection_failed' }, response.status);
    const organisations: unknown = await response.json().catch(() => null);
    if (!Array.isArray(organisations)) return json({ message: 'invalid_backend_response' }, 502);
    const selected = organisations.find((organisation) => organisation?.id === organisationId);
    if (!selected) return json({ message: 'organisation_access_denied' }, 403);
  }

  const response = json({ organisationId });
  response.cookies.set(
    ACTIVE_ORGANISATION_COOKIE,
    organisationId === null ? '' : encodeActiveOrganisation(organisationId, subject),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      ...(organisationId === null ? { maxAge: 0 } : {}),
    },
  );
  return response;
}
