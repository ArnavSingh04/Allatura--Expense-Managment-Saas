'use client';

import { Box, CircularProgress } from '@mui/material';
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

export default function DashboardAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { ready, session, isActive, isPending, isRejected } = useAuthSession();

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
    if (mounted && ready && !session) {
      router.replace('/login');
    }
  }, [mounted, ready, session, router]);

  if (!mounted || !ready) {
    return <CenteredLoader />;
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
