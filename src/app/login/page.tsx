'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { safeReturnTo } from '@/lib/safe-return-to';

/**
 * Pass a validated local destination to Auth0 so sign-in preserves deep links,
 * including the billing page. Missing or unsafe destinations use the dashboard.
 */
function LoginInner() {
  const search = useSearchParams();

  useEffect(() => {
    const requested = search.get('returnTo');
    const returnTo = safeReturnTo(requested);
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
