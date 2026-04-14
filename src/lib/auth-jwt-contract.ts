/**
 * Contract: access token (JWT) issued by PLUTUS-BE after login/register refresh.
 * The frontend reads these claims for RBAC UI and optional `x-tenant-id` header.
 *
 * Backend checklist (NestJS):
 * - Sign JWT with HS256/RS256; include:
 *   - `sub` (user id)
 *   - `email`
 *   - `role`: `"viewer"` | `"editor"` | `"admin"`
 *   - `tenantId`: Mongo ObjectId string (tenant / organisation)
 * - On every request: verify JWT, resolve tenant from `tenantId`, scope queries by tenant.
 * - Reject mutations when `role` is insufficient (mirror `src/lib/rbac.ts` rules).
 */

export type PlutusJwtPayload = {
  sub: string;
  email?: string;
  role: 'viewer' | 'editor' | 'admin';
  tenantId: string;
  iat?: number;
  exp?: number;
};
