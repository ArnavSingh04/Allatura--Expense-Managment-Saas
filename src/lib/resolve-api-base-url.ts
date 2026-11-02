/**
 * Resolves the API base URL for fetch() from the browser and from Node.
 *
 * Absolute backend URLs become /api/v1 in the browser, where the Next route
 * handler attaches the Auth0 token. Relative bases stay on the frontend origin;
 * server callers keep an absolute backend URL or resolve a relative base
 * against NEXT_PUBLIC_APP_URL.
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

  // An absolute API origin must still use the browser's authenticated proxy.
  // Do not condition this on the configured path ending in /v1.
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/v1`;
  }

  return base;
}
