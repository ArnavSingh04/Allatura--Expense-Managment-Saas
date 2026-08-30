'use client';

import { Box, CircularProgress, Typography } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { billingService, type PaidTier } from '@/services/billingService';

/**
 * Landing page for the mock (no-Stripe) checkout flow. The backend's mock
 * checkout redirects here; we call the mock simulate-success endpoint to apply
 * the plan, then bounce to the billing settings page.
 */
function MockSuccessInner() {
  const search = useSearchParams();
  const planParam = search.get('plan');
  const ran = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const plan: PaidTier | null =
      planParam === 'pro' || planParam === 'enterprise' ? planParam : null;
    const go = (result: 'success' | 'cancel') =>
      window.location.assign(`/dashboard/settings/billing?checkout=${result}`);
    if (!plan) {
      go('cancel');
      return;
    }
    billingService
      .mockSimulateSuccess(plan)
      .then(() => go('success'))
      .catch(() => setError('Could not apply the plan. Redirecting…'))
      .finally(() => {
        if (error) setTimeout(() => go('cancel'), 1500);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planParam]);

  return (
    <Box
      sx={{
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress size={28} />
      <Typography variant="body2" color="text.secondary">
        {error ?? 'Activating your plan…'}
      </Typography>
    </Box>
  );
}

export default function MockSuccessPage() {
  return (
    <Suspense fallback={null}>
      <MockSuccessInner />
    </Suspense>
  );
}
