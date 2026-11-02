'use client';

import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useHydrated } from '@/lib/use-hydrated';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import PendingApprovalScreen from './PendingApprovalScreen';
import RejectedScreen from './RejectedScreen';

/**
 * Layout-level gate for /dashboard/*. The DashboardShell wrapper (sidebar +
 * topbar + main) is always rendered by `dashboard/layout.tsx`; this gate only
 * decides what goes inside the main area: a spinner while we resolve the
 * session, a redirect-to-login no-op, the pending/rejected screen, or the
 * actual page. Keeping the shell stable avoids changing the outer DOM structure
 * while streamed content hydrates. API authorisation remains server-side.
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
 * Auth0 still exposes a user, but the domain profile could not be loaded.
 * Offer recovery according to the failure: retry, choose a workspace, or sign in.
 */
function SessionErrorScreen({
  isAuthFailure,
  isOrganisationFailure,
  onRetry,
  onSignOut,
}: {
  isAuthFailure: boolean;
  isOrganisationFailure?: boolean;
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
          {isOrganisationFailure
            ? 'This organisation is unavailable to your account. Choose an organisation above or try again after your access is restored.'
            : isAuthFailure
            ? 'Your session has expired or is no longer valid. Sign in again to continue.'
            : 'The API was unreachable. If you just came back from Stripe, wait a moment and try again — the backend may still be starting.'}
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

  // Keep this boundary's first client render aligned with the server loader,
  // even if the surrounding Auth0 context resolves before it hydrates.
  const mounted = useHydrated();

  useEffect(() => {
    if (!mounted || !ready) return;
    if (!isAuthenticated) {
      // Full navigation enters the Auth0 SDK route handled by src/proxy.ts.
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
    // A failed profile load is recoverable even while Auth0 remains signed in.
    if (error) {
      return (
        <SessionErrorScreen
          isAuthFailure={error.isAuthFailure}
          isOrganisationFailure={error.isOrganisationFailure}
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
