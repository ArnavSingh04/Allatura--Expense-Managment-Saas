/**
 * Auth0 integration using the Next.js proxy convention.
 *
 * Delegates to the Auth0 SDK, which mounts the auth routes
 * under /auth and manages rolling session cookies for matching requests.
 * Non-auth routes, including the /api/v1 route handler, pass through the SDK
 * so session handling also applies to API requests.
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
