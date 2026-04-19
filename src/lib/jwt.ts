/**
 * Typed helpers over the access token payload. Decoding is shared via
 * `jwt-decode.ts` (also used by `jwt-payload.ts`).
 */

import { decodeJwtPayloadJson } from './jwt-decode';

export { decodeJwtPayloadJson };

export type JwtClaims = {
  sub?: string;
  role?: 'admin' | 'editor' | 'viewer' | string;
  status?: 'PendingApproval' | 'Active' | 'Rejected' | string;
  /** Resolved tenant slug; mirrors `decodeAccessTokenPayload` / PLUTUS-BE (`tenantId` or `orgId`). */
  tenantId?: string;
  orgId?: string;
  email?: string;
  ver?: number;
};

export function getJwtClaims(token: string | null): JwtClaims | null {
  const payload = decodeJwtPayloadJson(token);
  if (!payload) {
    return null;
  }
  const tenantId =
    typeof payload.tenantId === 'string' ? payload.tenantId : undefined;
  const orgId = typeof payload.orgId === 'string' ? payload.orgId : undefined;
  return {
    sub: typeof payload.sub === 'string' ? payload.sub : undefined,
    role: typeof payload.role === 'string' ? payload.role : undefined,
    status: typeof payload.status === 'string' ? payload.status : undefined,
    tenantId: tenantId ?? orgId,
    orgId,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    ver: typeof payload.ver === 'number' ? payload.ver : undefined,
  };
}

export function getJwtSubject(token: string | null): string | null {
  return getJwtClaims(token)?.sub ?? null;
}
