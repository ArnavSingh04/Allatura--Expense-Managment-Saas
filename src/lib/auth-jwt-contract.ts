/**
 * Legacy local-JWT payload shape, retained separately from the current session.
 * Auth0 now handles sign-in, and AuthSessionContext obtains membership, role and
 * status from /auth/me. This type does not describe the current Auth0 token or
 * establish permission to access an organisation.
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
