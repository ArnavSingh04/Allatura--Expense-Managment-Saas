'use client';

import { Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import PendingApprovalScreen from './PendingApprovalScreen';
import RejectedScreen from './RejectedScreen';

/**
 * Layout-level gate for /dashboard/*. Until the session is ready we render
 * a spinner; then we either route to /login, render the pending/rejected
 * screen, or pass through to the actual dashboard. This makes it
 * structurally impossible for a non-Active user to render any page in the
 * dashboard tree.
 */
export default function DashboardAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { ready, session, isActive, isPending, isRejected } = useAuthSession();

  useEffect(() => {
    if (ready && !session) {
      router.replace('/login');
    }
  }, [ready, session, router]);

  if (!ready) {
    return (
      <Box
        sx={{
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
  if (!session) {
    // Effect above is redirecting; render nothing in the meantime.
    return null;
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
