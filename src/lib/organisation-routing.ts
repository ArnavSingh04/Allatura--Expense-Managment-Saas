/**
 * Keep account recovery and public routes available when a workspace is invalid.
 * This skips organisation selection only; each endpoint still enforces its auth rules.
 */
export function isOrganisationIndependentPath(path: string): boolean {
  const route = path.replace(/^\/+/, '').split('?')[0].replace(/\/+$/, '');
  return ['auth/organisations', 'auth/onboarding', 'auth/logout', 'health', 'plans', 'contact'].includes(route)
    || /^invitations\/lookup\/[^/]+$/.test(route);
}
