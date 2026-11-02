export const ACTIVE_ORGANISATION_COOKIE = 'allatura_active_org';

export function isOrganisationId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

// This cookie records a preference, not permission. The backend must still check
// membership when the proxy forwards the selected organisation.
export function encodeActiveOrganisation(organisationId: string, subject: string): string {
  return encodeURIComponent(JSON.stringify({ organisationId, subject }));
}

/** A preference belongs to one authenticated identity, never to the browser alone. */
export function readActiveOrganisation(
  value: string | undefined,
  subject: string,
): { organisationId: string | null; invalid: boolean } {
  const empty = { organisationId: null, invalid: false };
  if (!value || !subject) return empty;
  try {
    const preference = JSON.parse(decodeURIComponent(value)) as {
      organisationId?: unknown;
      subject?: unknown;
    };
    // A previous account's preference is ignored. A malformed selection for
    // this account stays invalid so the proxy cannot silently choose another org.
    if (preference?.subject !== subject) return empty;
    return isOrganisationId(preference.organisationId)
      ? { organisationId: preference.organisationId, invalid: false }
      : { organisationId: null, invalid: true };
  } catch {
    return { organisationId: null, invalid: true };
  }
}
