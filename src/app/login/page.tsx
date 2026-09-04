'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Login is delegated entirely to Auth0 Universal Login. This route just kicks
 * off the SDK login flow (mounted by middleware at /auth/login). After Auth0,
 * the callback returns the user to `returnTo` (defaulting to the dashboard),
 * and the AuthSessionProvider routes to onboarding if they have no
 * organisation yet.
 *
 * The incoming `?returnTo=` is honoured so deep links (e.g. the "Upgrade" CTA
 * on the pricing page → /dashboard/settings/billing) land where intended after
 * sign-in. Only same-origin relative paths are accepted, to avoid an open
 * redirect.
 */
function LoginInner() {
  const search = useSearchParams();

  useEffect(() => {
    const requested = search.get('returnTo');
    // Accept only same-origin absolute paths ("/foo"), never "//host" or
    // "https://…"; fall back to the dashboard otherwise.
    const returnTo =
      requested && /^\/(?!\/)/.test(requested) ? requested : '/dashboard';
    window.location.assign(
      `/auth/login?returnTo=${encodeURIComponent(returnTo)}`,
    );
  }, [search]);

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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
