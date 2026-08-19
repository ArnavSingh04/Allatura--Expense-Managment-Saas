import { apiGet, apiPost } from '@/lib/api-client';
import type { UserRole } from '@/lib/rbac';

export type InvitationStatus = 'Pending' | 'Accepted' | 'Expired' | 'Revoked';

export type Invitation = {
  id: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  expiresAt: string;
  invitedByName: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  resendCount: number;
  lastSentAt: string | null;
  createdAt?: string;
};

export type InviteLookup =
  | {
      valid: true;
      email: string;
      role: UserRole;
      organisationName: string;
      invitedByName: string;
      expiresAt: string;
    }
  | { valid: false; reason: 'not_found' | 'revoked' | 'accepted' | 'expired' };

export type OnboardingBody = {
  name: string;
  inviteToken?: string;
  organisationName?: string;
};

export const invitationService = {
  lookup: (token: string) =>
    apiGet<InviteLookup>(`invitations/lookup/${encodeURIComponent(token)}`),
  list: (status?: InvitationStatus) =>
    apiGet<Invitation[]>(`invitations${status ? `?status=${status}` : ''}`),
  create: (email: string, role: UserRole) =>
    apiPost<Invitation>('invitations', { email, role }),
  resend: (id: string) => apiPost<Invitation>(`invitations/${id}/resend`),
  revoke: (id: string) => apiPost<Invitation>(`invitations/${id}/revoke`),
};

/** Complete onboarding (create org or accept invite) for the signed-in user. */
export const submitOnboarding = (body: OnboardingBody) =>
  apiPost<{ needsOnboarding: boolean }>('auth/onboarding', body);
