/**
 * Decode JWT payload segment (no signature verification). Used client-side only
 * for UI convenience; API must enforce authz on every request.
 */
function base64UrlDecode(segment: string): string {
  const b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  return atob(padded);
}

export type JwtClaims = {
  sub?: string;
  role?: 'admin' | 'editor' | 'viewer' | string;
  tenantId?: string;
  email?: string;
};

export function getJwtClaims(token: string | null): JwtClaims | null {
  if (!token) {
    return null;
  }
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) {
      return null;
    }
    const payload = JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>;
    return {
      sub: typeof payload.sub === 'string' ? payload.sub : undefined,
      role: typeof payload.role === 'string' ? payload.role : undefined,
      tenantId: typeof payload.tenantId === 'string' ? payload.tenantId : undefined,
      email: typeof payload.email === 'string' ? payload.email : undefined,
    };
  } catch {
    return null;
  }
}

export function getJwtSubject(token: string | null): string | null {
  const claims = getJwtClaims(token);
  return claims?.sub ?? null;
}
