/**
 * Resolves the API base URL for fetch() from the browser and from Node.
 *
 * When NEXT_PUBLIC_BACKEND_API_URL points at http://localhost:*…/v1, browsers
 * would call the API origin directly and often hit CORS or "Failed to fetch".
 * In the browser we instead use the Next.js same-origin proxy (/api/v1 → Nest),
 * configured in next.config.js rewrites.
 */
export function resolveApiBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    process.env.BACKEND_API_URL ||
    '';
  const base = raw.replace(/\/$/, '');
  if (!base) {
    return '';
  }

  if (base.startsWith('/')) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${base}`;
    }
    const origin = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(
      /\/$/,
      '',
    );
    return `${origin}${base}`;
  }

  if (typeof window !== 'undefined') {
    try {
      const u = new URL(base);
      const path = u.pathname.replace(/\/$/, '');
      // Always route browser calls through the same-origin Next proxy (/api/v1).
      // The proxy injects the Auth0 RS256 access token server-side from the
      // session cookie; calling the API origin directly instead ships the
      // browser's stale HS256 localStorage token, which the backend's Auth0/JWKS
      // guard rejects with a 401 (and would also hit CORS). This must apply in
      // production too — not just localhost.
      if (path.endsWith('/v1')) {
        return `${window.location.origin}/api/v1`;
      }
    } catch {
      /* ignore */
    }
  }

  return base;
}
