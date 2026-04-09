/**
 * Claims read from the access token for RBAC UI and optional `x-tenant-id` header.
 * Must match PLUTUS-BE JWT payload (see `auth-jwt-contract.ts` and `docs/backend-auth-database.md`).
 */

import { decodeJwtPayloadJson } from '@/lib/jwt';

export type AccessTokenClaims = {
  sub?: string;
  email?: string;
  role?: string;
  tenantId?: string;
  orgId?: string;
};

export function decodeAccessTokenPayload(token: string): AccessTokenClaims | null {
  const raw = decodeJwtPayloadJson(token);
  if (!raw) {
    return null;
  }
  return {
    sub: typeof raw.sub === 'string' ? raw.sub : undefined,
    email: typeof raw.email === 'string' ? raw.email : undefined,
    role: typeof raw.role === 'string' ? raw.role : undefined,
    tenantId:
      typeof raw.tenantId === 'string'
        ? raw.tenantId
        : typeof raw.orgId === 'string'
          ? raw.orgId
          : undefined,
    orgId: typeof raw.orgId === 'string' ? raw.orgId : undefined,
  };
}

export function getTenantIdFromClaims(claims: AccessTokenClaims | null): string | undefined {
  if (!claims) {
    return undefined;
  }
  return claims.tenantId ?? claims.orgId;
}
