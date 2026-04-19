/**
 * Contract: access token (JWT) issued by PLUTUS-BE after login/register.
 * The frontend reads these claims for RBAC UI and the optional
 * `x-tenant-id` header.
 *
 * Backend checklist (NestJS):
 * - Sign JWT with HS256/RS256; include:
 *   - `sub` (user id)
 *   - `email`
 *   - `role`: `"viewer"` | `"editor"` | `"admin"`
 *   - `status`: `"PendingApproval"` | `"Active"` | `"Rejected"`
 *   - `tenantId`: tenant slug (Organisation.tenantId)
 *   - `ver`: integer mirroring `User.jwtVersion` — bumped server-side
 *     on reject / role / status change so old tokens fail verification.
 * - On every request: verify JWT, run StatusGuard (Active or @AllowPending),
 *   resolve tenant from `tenantId`, scope queries by tenant.
 * - Reject mutations when `role` is insufficient (mirror `src/lib/rbac.ts`).
 */

export type PlutusJwtPayload = {
  sub: string;
  email?: string;
  role: 'viewer' | 'editor' | 'admin';
  status: 'PendingApproval' | 'Active' | 'Rejected';
  tenantId: string;
  ver: number;
  iat?: number;
  exp?: number;
};
