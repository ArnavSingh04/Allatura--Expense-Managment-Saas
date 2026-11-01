/** Identity-only and public routes must survive an unavailable workspace. */
export function isOrganisationIndependentPath(path: string): boolean {
  const route = path.replace(/^\/+/, '').split('?')[0].replace(/\/+$/, '');
  return ['auth/organisations', 'auth/onboarding', 'auth/logout', 'health', 'plans', 'contact'].includes(route)
    || /^invitations\/lookup\/[^/]+$/.test(route);
}
