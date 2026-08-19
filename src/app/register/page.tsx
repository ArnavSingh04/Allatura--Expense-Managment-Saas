'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { useEffect } from 'react';

/**
 * Sign-up is delegated to Auth0 (screen_hint=signup shows the registration
 * form in Universal Login). After Auth0, the user is sent to /onboarding to
 * create an organisation (becoming its admin) or accept an invitation.
 */
export default function RegisterPage() {
  useEffect(() => {
    window.location.assign(
      '/auth/login?screen_hint=signup&returnTo=/onboarding',
    );
  }, []);

  return (
    <Box
      sx={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <CircularProgress size={28} />
      <Typography variant="body2" color="text.secondary">
        Redirecting to secure sign-up…
      </Typography>
    </Box>
  );
}
