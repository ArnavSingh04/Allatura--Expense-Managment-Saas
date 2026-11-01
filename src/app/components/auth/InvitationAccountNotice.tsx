'use client';

import { Alert, Box, Button } from '@mui/material';
import { useState } from 'react';
import { invitationEmailMismatch, prepareInvitationAccountSwitch } from '@/lib/invitation-account-switch';
import { setOrganisationBinding } from '@/lib/organisation-binding';

export default function InvitationAccountNotice({
  invitedEmail,
  currentEmail,
  token,
}: {
  invitedEmail: string;
  currentEmail: string;
  token: string;
}) {
  const [error, setError] = useState('');
  if (!invitationEmailMismatch(invitedEmail, currentEmail)) return null;
  const switchAccount = () => {
    try {
      const logoutUrl = prepareInvitationAccountSwitch(token, window.location.origin, window.sessionStorage);
      setOrganisationBinding(null);
      // The SDK forwards this absolute origin through Auth0 logout. The same
      // tab resumes the saved invite after its old session has been cleared.
      window.location.assign(logoutUrl);
    } catch {
      setError('Could not save the invitation for account switching. Try again in this browser tab.');
    }
  };
  return (
    <Box sx={{ my: 2 }}>
      <Alert severity="warning">
        This invitation is for {invitedEmail}. You are signed in as {currentEmail}.
        <Box sx={{ mt: 1 }}>
          <Button color="inherit" onClick={switchAccount}>Sign out and switch account</Button>
        </Box>
      </Alert>
      {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
    </Box>
  );
}
