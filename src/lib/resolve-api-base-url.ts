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
      if (
        (u.hostname === 'localhost' || u.hostname === '127.0.0.1') &&
        path.endsWith('/v1')
      ) {
        return `${window.location.origin}/api/v1`;
      }
    } catch {
      /* ignore */
    }
  }

  return base;
}
