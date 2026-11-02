/**
 * UI permission matrix for Allatura. Keep role/action changes aligned with the
 * backend, which independently authorises requests and scopes organisation data.
 * AuthSessionContext also requires Active status before exposing a capability;
 * the role-only can() helper below does not check membership or account status.
 */

export const ROLES = [
  'owner',
  'pm',
  'supervisor',
  'finance',
  'general',
  'subcontractor',
  'viewer',
  'admin',
  'editor',
] as const;
export type UserRole = (typeof ROLES)[number];

export const RBAC_ACTIONS = [
  'dashboard.view',
  'projects.view',
  'projects.create',
  'projects.edit',
  'projects.delete',
  'departments.edit',
  'contracts.view',
  'contracts.create',
  'contracts.edit',
  'contracts.delete',
  'variations.view',
  'variations.create',
  'variations.submit',
  'variations.decide',
  'expenses.view',
  'expenses.create',
  'expenses.edit',
  'expenses.markPaid',
  'claims.view',
  'claims.submit',
  'claims.certify',
  'claims.markPaid',
  'progress.view',
  'progress.edit',
  'sitelogs.view',
  'sitelogs.create',
  'documents.view',
  'documents.upload',
  'documents.delete',
  'subbies.view',
  'subbies.edit',
  'suppliers.view',
  'suppliers.edit',
  'imports.run',
  'audit.view',
  'settings.view',
  'tenant.admin',
] as const;
export type RbacAction = (typeof RBAC_ACTIONS)[number];

const VIEW_ALL: RbacAction[] = [
  'dashboard.view',
  'projects.view',
  'contracts.view',
  'variations.view',
  'expenses.view',
  'claims.view',
  'progress.view',
  'sitelogs.view',
  'documents.view',
  'subbies.view',
  'suppliers.view',
  'audit.view',
  'settings.view',
];

const matrix: Record<UserRole, Set<RbacAction>> = {
  viewer: new Set([
    'dashboard.view',
    'projects.view',
    'contracts.view',
    'variations.view',
    'expenses.view',
    'claims.view',
    'progress.view',
    'sitelogs.view',
    'documents.view',
    'settings.view',
  ]),
  subcontractor: new Set([
    'dashboard.view',
    'projects.view',
    'contracts.view',
    'variations.view',
    'progress.view',
    'documents.view',
    'documents.upload',
    'claims.view',
    'claims.submit',
    'settings.view',
  ]),
  supervisor: new Set([
    ...VIEW_ALL,
    'departments.edit',
    'progress.edit',
    'expenses.create',
    'sitelogs.create',
    'documents.upload',
    'variations.create',
    'variations.submit',
  ]),
  finance: new Set([
    ...VIEW_ALL,
    'expenses.create',
    'expenses.edit',
    'expenses.markPaid',
    'claims.certify',
    'claims.markPaid',
    'documents.upload',
    'subbies.view',
    'subbies.edit',
    'suppliers.view',
    'suppliers.edit',
  ]),
  // 'general' onboarding role: can view relevant data and CREATE variations /
  // payment requests, but cannot approve/decide anything or manage users.
  general: new Set([
    ...VIEW_ALL,
    'variations.create',
    'variations.submit',
    'claims.submit',
    'documents.upload',
  ]),
  pm: new Set([
    ...VIEW_ALL,
    'projects.create',
    'projects.edit',
    'departments.edit',
    'contracts.create',
    'contracts.edit',
    'variations.create',
    'variations.submit',
    'variations.decide',
    'expenses.create',
    'expenses.edit',
    'claims.certify',
    'progress.edit',
    'sitelogs.create',
    'documents.upload',
    'documents.delete',
    'subbies.edit',
    'suppliers.edit',
    'imports.run',
  ]),
  owner: new Set(RBAC_ACTIONS),
  // Legacy roles map to nearest construction equivalent.
  admin: new Set(RBAC_ACTIONS),
  editor: new Set([
    ...VIEW_ALL,
    'projects.create',
    'projects.edit',
    'departments.edit',
    'contracts.create',
    'contracts.edit',
    'variations.create',
    'variations.submit',
    'variations.decide',
    'expenses.create',
    'expenses.edit',
    'claims.certify',
    'progress.edit',
    'sitelogs.create',
    'documents.upload',
    'documents.delete',
    'subbies.edit',
    'suppliers.edit',
    'imports.run',
  ]),
};

export function normalizeRole(value: unknown): UserRole {
  const s = typeof value === 'string' ? value.toLowerCase().trim() : '';
  if (
    s === 'owner' ||
    s === 'pm' ||
    s === 'supervisor' ||
    s === 'finance' ||
    s === 'general' ||
    s === 'subcontractor' ||
    s === 'viewer' ||
    s === 'admin' ||
    s === 'editor'
  ) {
    return s;
  }
  return 'viewer';
}

export function can(role: UserRole, action: RbacAction): boolean {
  return matrix[role].has(action);
}

export function assertRbacMatrixInvariants(): string[] {
  const errors: string[] = [];
  if (matrix.viewer.has('expenses.create')) {
    errors.push('viewer must not create expenses');
  }
  if (!matrix.subcontractor.has('claims.submit')) {
    errors.push('subcontractor must submit claims');
  }
  if (!matrix.finance.has('claims.certify')) {
    errors.push('finance must certify claims');
  }
  if (!matrix.pm.has('contracts.create')) {
    errors.push('pm must create contracts');
  }
  // Imports can create projects and contracts. Keep the finance UI restriction
  // aligned with those write capabilities and the backend's import permission.
  if (matrix.finance.has('imports.run')) {
    errors.push('finance must not run imports');
  }
  if (!matrix.pm.has('imports.run')) {
    errors.push('pm must run imports');
  }
  if (!matrix.owner.has('tenant.admin')) {
    errors.push('owner must have tenant.admin');
  }
  return errors;
}

export const ROLE_LABEL: Record<UserRole, string> = {
  owner: 'Owner',
  pm: 'Project manager',
  supervisor: 'Site supervisor',
  finance: 'Finance',
  general: 'General',
  subcontractor: 'Subcontractor',
  viewer: 'Viewer',
  admin: 'Admin',
  editor: 'Project manager',
};
