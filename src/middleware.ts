/**
 * Edge middleware: cookie-based gate for /dashboard/*. The JWT signature is
 * NOT verified here (no secret in the edge runtime); the API enforces real
 * authn/authz. This middleware exists only to short-circuit obvious cases
 * (no token, rejected status) before the SPA shell loads.
 */

import { NextRequest, NextResponse } from 'next/server';

const DASHBOARD_PREFIX = '/dashboard';

type LightClaims = {
  status?: string;
  exp?: number;
};

function base64UrlDecode(segment: string): string | null {
  try {
    const b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    if (typeof atob === 'function') {
      return atob(padded);
    }
    return Buffer.from(padded, 'base64').toString('binary');
  } catch {
    return null;
  }
}

function decodeClaims(token: string): LightClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) {
    return null;
  }
  const json = base64UrlDecode(parts[1]);
  if (!json) {
    return null;
  }
  try {
    const obj = JSON.parse(json) as Record<string, unknown>;
    return {
      status: typeof obj.status === 'string' ? obj.status : undefined,
      exp: typeof obj.exp === 'number' ? obj.exp : undefined,
    };
  } catch {
    return null;
  }
}

function readToken(request: NextRequest): string | undefined {
  const raw = request.cookies.get('plutus_access_token')?.value;
  if (!raw) {
    return undefined;
  }
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith(DASHBOARD_PREFIX)) {
    return NextResponse.next();
  }

  const token = readToken(request);
  if (!token) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  const claims = decodeClaims(token);

  // Expired tokens: clear and bounce to login.
  if (claims?.exp && claims.exp * 1000 < Date.now()) {
    const url = new URL('/login', request.url);
    const res = NextResponse.redirect(url);
    res.cookies.set('plutus_access_token', '', { path: '/', maxAge: 0 });
    return res;
  }

  // Rejected: clear cookie and send to login with a hint.
  if (claims?.status === 'Rejected') {
    const url = new URL('/login', request.url);
    url.searchParams.set('reason', 'rejected');
    const res = NextResponse.redirect(url);
    res.cookies.set('plutus_access_token', '', { path: '/', maxAge: 0 });
    return res;
  }

  // Pending: the dashboard layout's <DashboardAuthGate/> renders the pending
  // screen for any /dashboard/* path. We don't redirect here because that
  // would prevent the user from browsing back to /login if they want to.
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
