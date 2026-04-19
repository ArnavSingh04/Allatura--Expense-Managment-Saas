/**
 * Claims read from the access token for RBAC UI and the optional `x-tenant-id` header.
 * Must match PLUTUS-BE JWT payload (see `auth-jwt-contract.ts`).
 */

import { decodeJwtPayloadJson } from '@/lib/jwt-decode';

export type AccessTokenClaims = {
  sub?: string;
  email?: string;
  role?: 'admin' | 'editor' | 'viewer';
  status?: 'PendingApproval' | 'Active' | 'Rejected';
  tenantId?: string;
  orgId?: string;
  ver?: number;
};

function asRole(value: unknown): AccessTokenClaims['role'] | undefined {
  if (value === 'admin' || value === 'editor' || value === 'viewer') {
    return value;
  }
  return undefined;
}

function asStatus(value: unknown): AccessTokenClaims['status'] | undefined {
  if (
    value === 'PendingApproval' ||
    value === 'Active' ||
    value === 'Rejected'
  ) {
    return value;
  }
  return undefined;
}

export function decodeAccessTokenPayload(
  token: string,
): AccessTokenClaims | null {
  const raw = decodeJwtPayloadJson(token);
  if (!raw) {
    return null;
  }
  return {
    sub: typeof raw.sub === 'string' ? raw.sub : undefined,
    email: typeof raw.email === 'string' ? raw.email : undefined,
    role: asRole(raw.role),
    status: asStatus(raw.status),
    tenantId:
      typeof raw.tenantId === 'string'
        ? raw.tenantId
        : typeof raw.orgId === 'string'
          ? raw.orgId
          : undefined,
    orgId: typeof raw.orgId === 'string' ? raw.orgId : undefined,
    ver: typeof raw.ver === 'number' ? raw.ver : undefined,
  };
}

export function getTenantIdFromClaims(
  claims: AccessTokenClaims | null,
): string | undefined {
  if (!claims) {
    return undefined;
  }
  return claims.tenantId ?? claims.orgId;
}
