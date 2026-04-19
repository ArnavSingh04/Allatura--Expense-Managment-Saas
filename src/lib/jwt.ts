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
  tenantId?: string;
  email?: string;
  ver?: number;
};

export function getJwtClaims(token: string | null): JwtClaims | null {
  const payload = decodeJwtPayloadJson(token);
  if (!payload) {
    return null;
  }
  return {
    sub: typeof payload.sub === 'string' ? payload.sub : undefined,
    role: typeof payload.role === 'string' ? payload.role : undefined,
    status: typeof payload.status === 'string' ? payload.status : undefined,
    tenantId:
      typeof payload.tenantId === 'string' ? payload.tenantId : undefined,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    ver: typeof payload.ver === 'number' ? payload.ver : undefined,
  };
}

export function getJwtSubject(token: string | null): string | null {
  return getJwtClaims(token)?.sub ?? null;
}
