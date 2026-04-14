/**
 * Role matrix (admin / editor / viewer) for SmartTrack (Plutus FE).
 * UI gates only — the API must enforce the same rules.
 *
 * | Capability              | viewer | editor | admin |
 * |-------------------------|--------|--------|-------|
 * | View dashboard          | yes    | yes    | yes   |
 * | View systems/contracts  | yes    | yes    | yes   |
 * | Create/edit systems     | no     | yes    | yes   |
 * | Create/edit contracts   | no     | yes    | yes   |
 * | CSV import              | no     | yes    | yes   |
 * | Log renewal decision    | no     | yes    | yes   |
 * | View renewals/calendar  | yes    | yes    | yes   |
 * | View audit log          | yes    | yes    | yes   |
 * | Tenant admin (future)   | no     | no     | yes   |
 */

export const ROLES = ['viewer', 'editor', 'admin'] as const;
export type UserRole = (typeof ROLES)[number];

export const RBAC_ACTIONS = [
  'dashboard.view',
  'systems.view',
  'systems.create',
  'systems.edit',
  'contracts.view',
  'contracts.create',
  'contracts.edit',
  'renewals.view',
  'renewals.decide',
  'import.run',
  'calendar.view',
  'audit.view',
  'settings.view',
  'tenant.admin',
] as const;
export type RbacAction = (typeof RBAC_ACTIONS)[number];

const matrix: Record<UserRole, Set<RbacAction>> = {
  viewer: new Set([
    'dashboard.view',
    'systems.view',
    'contracts.view',
    'renewals.view',
    'calendar.view',
    'audit.view',
    'settings.view',
  ]),
  editor: new Set([
    'dashboard.view',
    'systems.view',
    'systems.create',
    'systems.edit',
    'contracts.view',
    'contracts.create',
    'contracts.edit',
    'renewals.view',
    'renewals.decide',
    'import.run',
    'calendar.view',
    'audit.view',
    'settings.view',
  ]),
  admin: new Set(RBAC_ACTIONS),
};

export function normalizeRole(value: unknown): UserRole {
  const s = typeof value === 'string' ? value.toLowerCase().trim() : '';
  if (s === 'viewer' || s === 'editor' || s === 'admin') {
    return s;
  }
  return 'viewer';
}

export function can(role: UserRole, action: RbacAction): boolean {
  return matrix[role].has(action);
}

export function assertRbacMatrixInvariants(): string[] {
  const errors: string[] = [];
  if (matrix.viewer.has('import.run')) {
    errors.push('viewer must not have import.run');
  }
  if (!matrix.editor.has('import.run')) {
    errors.push('editor must have import.run');
  }
  if (!matrix.admin.has('tenant.admin')) {
    errors.push('admin must have tenant.admin');
  }
  return errors;
}
