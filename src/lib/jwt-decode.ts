/**
 * Decode JWT payload segment (no signature verification). Used client-side
 * only for UI convenience; the API enforces authz on every request.
 */

function base64UrlDecode(segment: string): string {
  const b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  return atob(padded);
}

/** Returns the raw decoded payload JSON object, or null if the token is unparseable. */
export function decodeJwtPayloadJson(
  token: string | null,
): Record<string, unknown> | null {
  if (!token) {
    return null;
  }
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) {
      return null;
    }
    return JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>;
  } catch {
    return null;
  }
}
