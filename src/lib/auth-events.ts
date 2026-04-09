export const PLUTUS_AUTH_UPDATED_EVENT = 'plutus-auth-updated';

export function notifyAuthUpdated(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new Event(PLUTUS_AUTH_UPDATED_EVENT));
}
