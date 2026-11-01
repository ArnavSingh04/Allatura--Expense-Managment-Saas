export const PENDING_INVITATION_KEY = 'allatura_pending_invitation';

type ContinuationStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function invitationEmailMismatch(invited: string, current: string): boolean {
  return !!current.trim() && invited.trim().toLowerCase() !== current.trim().toLowerCase();
}

/** Called only by the explicit account-switch button. Logout uses an allowlisted origin. */
export function prepareInvitationAccountSwitch(
  token: string,
  origin: string,
  storage: ContinuationStorage,
): string {
  storage.setItem(PENDING_INVITATION_KEY, `/onboarding?invite=${encodeURIComponent(token)}`);
  return `/auth/logout?returnTo=${encodeURIComponent(origin)}`;
}

/** Consume before redirecting, and accept only an invitation on this origin. */
export function takeInvitationContinuation(storage: ContinuationStorage, origin: string): string | null {
  const stored = storage.getItem(PENDING_INVITATION_KEY);
  if (!stored) return null;
  storage.removeItem(PENDING_INVITATION_KEY);
  if (!stored.startsWith('/onboarding?')) return null;
  try {
    const url = new URL(stored, origin);
    const token = url.searchParams.get('invite');
    if (url.origin !== origin || url.pathname !== '/onboarding' || !token || token.length > 1024) return null;
    return `/onboarding?invite=${encodeURIComponent(token)}`;
  } catch {
    return null;
  }
}
