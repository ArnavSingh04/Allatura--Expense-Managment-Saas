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

  // Always route browser calls through the same-origin Next proxy (/api/v1),
  // whatever NEXT_PUBLIC_BACKEND_API_URL points at. The proxy injects the Auth0
  // RS256 access token server-side from the session cookie; calling the API
  // origin directly from the browser would both miss that token and hit CORS.
  // This is unconditional on purpose — it previously applied only when the
  // configured path happened to end in `/v1`, so a base URL without that suffix
  // silently sent browser traffic straight to the API origin.
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/v1`;
  }

  return base;
}
