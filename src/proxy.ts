/**
 * Edge proxy (Next.js 16+ "proxy" convention, formerly middleware).
 *
 * Delegates to the Auth0 SDK, which mounts the auth routes
 * (/auth/login, /auth/logout, /auth/callback, /auth/access-token,
 * /auth/profile, /auth/backchannel-logout) and refreshes the rolling session
 * cookie on every request. Non-auth routes (including the /api/v1 proxy route
 * handler) pass through with a refreshed session.
 *
 * Real authorization is enforced by the Nest backend on every API call; the
 * client-side <DashboardAuthGate/> handles UX-level redirects.
 */
import type { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function proxy(request: NextRequest) {
  return auth0.middleware(request);
}

export const config = {
  matcher: [
    // Everything except Next internals and static asset file extensions. Must
    // include /auth/* (handled by the SDK) and /api/v1/* (pass-through).
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
