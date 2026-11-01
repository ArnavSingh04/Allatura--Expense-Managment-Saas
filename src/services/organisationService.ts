import { ApiError } from '@/lib/api-client';

/** Switch only after an explicit choice; reload afterwards to drop workspace caches. */
export async function activateOrganisation(organisationId: string | null): Promise<void> {
  const response = await fetch('/api/active-organisation', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ organisationId }),
    cache: 'no-store',
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null;
    throw new ApiError(body?.message || 'organisation_selection_failed', response.status);
  }
}
