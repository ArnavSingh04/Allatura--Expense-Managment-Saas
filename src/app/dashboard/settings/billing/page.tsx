'use client';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import {
  billingService,
  type BillingSnapshot,
  type PaidTier,
} from '@/services/billingService';
import { ApiError } from '@/lib/api-client';

function friendlyError(err: unknown): string {
  const raw = err instanceof ApiError ? err.message : String(err);
  switch (raw) {
    case 'already_on_plan_or_higher':
      return "You're already on this plan or a higher one.";
    case 'stripe_not_configured':
      return "Billing isn't configured yet. Please try again shortly.";
    case 'no_stripe_customer':
      return 'No billing account exists yet — upgrade to a paid plan first.';
    case 'Forbidden':
    case 'forbidden_role':
      return 'Only an organisation owner or admin can change the plan.';
    case 'missing_env:STRIPE_PRICE_PRO':
    case 'missing_env:STRIPE_PRICE_ENTERPRISE':
      return "This plan isn't available for purchase yet.";
    default:
      return raw || 'Something went wrong.';
  }
}

const PLAN_LABEL: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

function fmtLimit(n: number | null): string {
  return n === null ? 'Unlimited' : String(n);
}

function BillingInner() {
  const search = useSearchParams();
  const checkoutResult = search.get('checkout'); // 'success' | 'cancel' | null

  const [snap, setSnap] = useState<BillingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    billingService
      .me()
      .then((s) => setSnap(s))
      .catch((e) => setError(friendlyError(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upgrade = async (plan: PaidTier) => {
    setError(null);
    setBusy(plan);
    try {
      const { url } = await billingService.checkout(plan);
      if (url) window.location.assign(url);
      else {
        setError('Could not start checkout. Please try again.');
        setBusy(null);
      }
    } catch (e) {
      setError(friendlyError(e));
      setBusy(null);
    }
  };

  const manageBilling = async () => {
    setError(null);
    setBusy('portal');
    try {
      const { url } = await billingService.portal();
      if (url) window.location.assign(url);
      else {
        setError('The billing portal is only available on paid Stripe plans.');
        setBusy(null);
      }
    } catch (e) {
      setError(friendlyError(e));
      setBusy(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Typography variant="h4" gutterBottom>
        Billing
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your Allatura subscription and see your current usage.
      </Typography>

      {checkoutResult === 'success' && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Thanks! Your subscription is being activated. It can take a few seconds
          to appear here.
        </Alert>
      )}
      {checkoutResult === 'cancel' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Checkout was cancelled — your plan is unchanged.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : snap ? (
        <Paper sx={{ p: 4 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <Typography variant="h6">
              {PLAN_LABEL[snap.plan] ?? snap.plan} plan
            </Typography>
            {snap.subscriptionStatus && (
              <Chip
                size="small"
                label={snap.subscriptionStatus}
                color={
                  snap.subscriptionStatus === 'active' ||
                  snap.subscriptionStatus === 'trialing'
                    ? 'success'
                    : 'default'
                }
              />
            )}
            {snap.billingMode === 'mock' && (
              <Chip size="small" variant="outlined" label="mock billing" />
            )}
          </Stack>

          {snap.trialEndsAt && (
            <Typography variant="body2" color="text.secondary">
              Trial ends {new Date(snap.trialEndsAt).toLocaleDateString()}
            </Typography>
          )}
          {snap.currentPeriodEnd && (
            <Typography variant="body2" color="text.secondary">
              Renews {new Date(snap.currentPeriodEnd).toLocaleDateString()}
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Usage
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Projects: {snap.usage.projects} / {fmtLimit(snap.limits.projects)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Users: {snap.usage.users} / {fmtLimit(snap.limits.users)}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {snap.plan !== 'pro' && snap.plan !== 'enterprise' && (
              <Button
                variant="contained"
                disabled={busy !== null}
                onClick={() => upgrade('pro')}
              >
                {busy === 'pro' ? 'Redirecting…' : 'Upgrade to Pro'}
              </Button>
            )}
            {snap.plan !== 'enterprise' && (
              <Button
                variant={snap.plan === 'pro' ? 'contained' : 'outlined'}
                disabled={busy !== null}
                onClick={() => upgrade('enterprise')}
              >
                {busy === 'enterprise'
                  ? 'Redirecting…'
                  : 'Upgrade to Enterprise'}
              </Button>
            )}
            {snap.billingMode === 'stripe' && snap.plan !== 'free' && (
              <Button
                variant="text"
                disabled={busy !== null}
                onClick={manageBilling}
              >
                {busy === 'portal' ? 'Opening…' : 'Manage billing'}
              </Button>
            )}
          </Stack>
        </Paper>
      ) : null}
    </Box>
  );
}

export default function BillingSettingsPage() {
  return (
    <Suspense fallback={null}>
      <BillingInner />
    </Suspense>
  );
}
