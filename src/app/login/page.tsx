'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { useEffect } from 'react';

/**
 * Login is delegated entirely to Auth0 Universal Login. This route just kicks
 * off the SDK login flow (mounted by middleware at /auth/login). After Auth0,
 * the callback returns the user to the dashboard, and the AuthSessionProvider
 * routes to onboarding if they have no organisation yet.
 */
export default function LoginPage() {
  useEffect(() => {
    window.location.assign('/auth/login?returnTo=/dashboard');
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
        Redirecting to secure sign-in…
      </Typography>
    </Box>
  );
}
