'use client';

import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import PendingApprovalScreen from './PendingApprovalScreen';
import RejectedScreen from './RejectedScreen';

/**
 * Layout-level gate for /dashboard/*. The DashboardShell wrapper (sidebar +
 * topbar + main) is always rendered by `dashboard/layout.tsx`; this gate only
 * decides what goes inside the main area: a spinner while we resolve the
 * session, a redirect-to-login no-op, the pending/rejected screen, or the
 * actual page. Keeping the shell stable across hydration prevents the
 * spinner-vs-shell DOM swap that produced a Next.js 16 hydration mismatch.
 */
function CenteredLoader() {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress size={28} />
    </Box>
  );
}

/**
 * Shown when the Auth0 session is valid but `/auth/me` could not be resolved
 * (rejected token, server/network error). Replaces what used to be an endless
 * spinner so the user can always recover — retry, or sign in again to mint a
 * fresh token.
 */
function SessionErrorScreen({
  isAuthFailure,
  onRetry,
  onSignOut,
}: {
  isAuthFailure: boolean;
  onRetry: () => void;
  onSignOut: () => void;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Stack spacing={2} alignItems="center" sx={{ maxWidth: 420, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          We couldn&apos;t load your account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isAuthFailure
            ? 'Your session has expired or is no longer valid. Sign in again to continue.'
            : 'Something went wrong reaching the server. Check your connection and try again.'}
        </Typography>
        <Stack direction="row" spacing={1.5}>
          {!isAuthFailure && (
            <Button variant="outlined" onClick={onRetry}>
              Try again
            </Button>
          )}
          <Button variant="contained" onClick={onSignOut}>
            Sign in again
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

export default function DashboardAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const {
    ready,
    isAuthenticated,
    needsOnboarding,
    session,
    error,
    isActive,
    isPending,
    isRejected,
    refresh,
    signOut,
  } = useAuthSession();

  // `mounted` is false on the server and on the very first client render, so
  // the gate's first paint is always the loader and always matches the SSR
  // output. Without this, React 19's concurrent hydration could commit the
  // post-effect re-render (ready=true) against the SSR HTML (ready=false) and
  // surface that as a hydration mismatch instead of a normal state update.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !ready) return;
    if (!isAuthenticated) {
      // Full navigation into the Auth0 SDK login route (handled by middleware).
      const returnTo = window.location.pathname + window.location.search;
      window.location.assign(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    if (needsOnboarding) {
      router.replace('/onboarding');
    }
  }, [mounted, ready, isAuthenticated, needsOnboarding, router]);

  if (!mounted || !ready) {
    return <CenteredLoader />;
  }
  if (!isAuthenticated || needsOnboarding) {
    // Effect above is redirecting; render nothing in the meantime.
    return null;
  }
  if (!session) {
    // `ready` only flips true after /auth/me settles, so reaching here with no
    // session means the fetch failed. Offer recovery instead of an endless
    // spinner (the previous behaviour, which stranded users on a blank load).
    if (error) {
      return (
        <SessionErrorScreen
          isAuthFailure={error.isAuthFailure}
          onRetry={refresh}
          onSignOut={signOut}
        />
      );
    }
    return <CenteredLoader />;
  }
  if (isRejected) {
    return <RejectedScreen />;
  }
  if (isPending) {
    return <PendingApprovalScreen />;
  }
  if (!isActive) {
    // Defensive: any unknown future status is denied.
    return <PendingApprovalScreen />;
  }
  return <>{children}</>;
}
