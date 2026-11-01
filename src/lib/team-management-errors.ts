const messages: Record<string, string> = {
  email_not_configured:
    'Invitation email is not configured. Ask an administrator to configure email delivery.',
  email_delivery_failed:
    'The invitation email could not be delivered. Try again, or contact an administrator if the problem continues.',
  invitation_delivery_failed:
    'The invitation email could not be delivered. Try again, or contact an administrator if the problem continues.',
  invite_changed:
    'This invitation changed while you were editing it. Refresh the invitations and try again.',
  email_already_registered:
    'An Allatura account already exists for this email. Sign in with that account to continue.',
  user_already_member:
    'This person is already in your organisation. Manage their role and access from User management.',
  invite_already_pending:
    'An invitation is already pending for this email. Use Resend to send a fresh link.',
  cannot_change_own_role:
    'Ask another administrator to change your role. You cannot change your own role.',
  cannot_change_own_status:
    'Ask another administrator to change your access. You cannot change your own access.',
  cannot_demote_owner:
    'The organisation owner must retain an administrator role.',
  cannot_disable_owner:
    "The organisation owner's access cannot be revoked.",
  active_organisation_member_required:
    'Choose an active member of your organisation. Refresh the member list if their access has changed.',
  project_not_found:
    'This project is no longer available. Return to Projects and try again.',
  organisation_access_denied:
    'You no longer have access to this organisation. Choose another organisation or use your original organisation.',
  organisation_selection_failed:
    'Could not switch organisation. Refresh and try again.',
  plan_limit_reached:
    'This organisation has reached its member limit. Free a member seat or upgrade the plan before inviting or restoring access.',
};

export function teamManagementError(error: unknown, fallback: string): string {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : '';
  return messages[message] || message || fallback;
}
