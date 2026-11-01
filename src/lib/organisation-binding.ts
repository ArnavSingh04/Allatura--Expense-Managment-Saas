import { isOrganisationIndependentPath } from '@/lib/organisation-routing';

// Module state belongs to this browser tab. The shared preference cookie only
// chooses the workspace on a fresh page load; it must not retarget an open tab.
let organisationId: string | null = null;

export function setOrganisationBinding(value: string | null): void {
  organisationId = value;
}

export function organisationRequestHeaders(path: string): Record<string, string> {
  if (!organisationId || isOrganisationIndependentPath(path)) return {};
  return { 'x-organisation-id': organisationId };
}
