'use client';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import {
  billingService,
  type BillingSnapshot,
  type PaidTier,
  type PlanCatalogEntry,
  type PlanFeatureKey,
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
    case 'no_active_subscription':
      return "You don't have an active paid subscription to cancel.";
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

// Human labels + display order for the plan-comparison feature rows.
const FEATURE_ROWS: { key: PlanFeatureKey; label: string }[] = [
  { key: 'variations', label: 'Variations' },
  { key: 'departmentExpenses', label: 'Department expenses' },
  { key: 'analytics', label: 'Advanced analytics' },
  { key: 'auditLog', label: 'Audit log' },
  { key: 'prioritySupport', label: 'Priority support' },
];

function fmtLimit(n: number | null): string {
  return n === null ? 'Unlimited' : String(n);
}

function fmtPrice(cents: number): string {
  if (cents === 0) return '$0';
  return `$${(cents / 100).toLocaleString()}`;
}

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '';
}

function BoolCell({ on }: { on: boolean }) {
  return on ? (
    <CheckCircleRoundedIcon fontSize="small" color="success" aria-label="Included" />
  ) : (
    <RemoveRoundedIcon fontSize="small" sx={{ color: 'text.disabled' }} aria-label="Not included" />
  );
}

/** Side-by-side comparison of every plan, highlighting the org's current tier. */
function PlanComparison({
  catalog,
  currentPlan,
}: {
  catalog: PlanCatalogEntry[];
  currentPlan: string;
}) {
  if (!catalog.length) return null;
  const highlight = (tier: string) =>
    tier === currentPlan
      ? { bgcolor: (th: any) => th.palette.action.selected }
      : undefined;

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 520 }}>
        <TableHead>
          <TableRow>
            <TableCell />
            {catalog.map((p) => (
              <TableCell key={p.tier} align="center" sx={highlight(p.tier)}>
                <Stack spacing={0.5} alignItems="center">
                  <Typography variant="subtitle2">{p.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {fmtPrice(p.monthlyPriceCents)}
                    {p.monthlyPriceCents > 0 ? ' / mo' : ''}
                  </Typography>
                  {p.tier === currentPlan && (
                    <Chip size="small" color="primary" label="Current" />
                  )}
                </Stack>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>Projects</TableCell>
            {catalog.map((p) => (
              <TableCell key={p.tier} align="center" sx={highlight(p.tier)}>
                {fmtLimit(p.limits.projects)}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell>Users</TableCell>
            {catalog.map((p) => (
              <TableCell key={p.tier} align="center" sx={highlight(p.tier)}>
                {fmtLimit(p.limits.users)}
              </TableCell>
            ))}
          </TableRow>
          {FEATURE_ROWS.map((row) => (
            <TableRow key={row.key}>
              <TableCell>{row.label}</TableCell>
              {catalog.map((p) => (
                <TableCell key={p.tier} align="center" sx={highlight(p.tier)}>
                  <BoolCell on={Boolean(p.features[row.key])} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

function BillingInner() {
  const search = useSearchParams();
  const checkoutResult = search.get('checkout'); // 'success' | 'cancel' | null

  const [snap, setSnap] = useState<BillingSnapshot | null>(null);
  const [catalog, setCatalog] = useState<PlanCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([billingService.me(), billingService.plans().catch(() => [])])
      .then(([s, c]) => {
        setSnap(s);
        setCatalog(c);
      })
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

  const cancelSubscription = async () => {
    setConfirmCancel(false);
    setError(null);
    setNotice(null);
    setBusy('cancel');
    try {
      await billingService.cancel();
      setNotice('Your subscription will cancel at the end of the current billing period.');
      load();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(null);
    }
  };

  const resumeSubscription = async () => {
    setError(null);
    setNotice(null);
    setBusy('resume');
    try {
      await billingService.resume();
      setNotice('Your subscription has been resumed — it will keep renewing.');
      load();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Box sx={{ maxWidth: 820 }}>
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
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>
          {notice}
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
        <Stack spacing={3}>
          <Paper sx={{ p: 4 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6">
                {PLAN_LABEL[snap.plan] ?? snap.plan} plan
              </Typography>
              {snap.subscriptionStatus && (
                <Chip
                  size="small"
                  label={snap.subscriptionStatus}
                  color={
                    snap.subscriptionStatus === 'active' ? 'success' : 'default'
                  }
                />
              )}
              {snap.cancelAtPeriodEnd && (
                <Chip size="small" color="warning" label="cancelling" />
              )}
              {snap.billingMode === 'mock' && (
                <Chip size="small" variant="outlined" label="mock billing" />
              )}
            </Stack>

            {snap.cancelAtPeriodEnd && snap.currentPeriodEnd ? (
              <Typography variant="body2" color="warning.main">
                Your plan cancels on {fmtDate(snap.currentPeriodEnd)} and reverts
                to Free.
              </Typography>
            ) : snap.currentPeriodEnd ? (
              <Typography variant="body2" color="text.secondary">
                Renews {fmtDate(snap.currentPeriodEnd)}
              </Typography>
            ) : null}

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
                  {busy === 'enterprise' ? 'Redirecting…' : 'Upgrade to Enterprise'}
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
              {snap.plan !== 'free' &&
                (snap.cancelAtPeriodEnd ? (
                  <Button
                    variant="outlined"
                    color="success"
                    disabled={busy !== null}
                    onClick={resumeSubscription}
                  >
                    {busy === 'resume' ? 'Resuming…' : 'Resume subscription'}
                  </Button>
                ) : (
                  <Button
                    variant="text"
                    color="error"
                    disabled={busy !== null}
                    onClick={() => setConfirmCancel(true)}
                  >
                    {busy === 'cancel' ? 'Cancelling…' : 'Cancel subscription'}
                  </Button>
                ))}
            </Stack>
          </Paper>

          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Compare plans
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              What each tier includes. Your current plan is highlighted.
            </Typography>
            <PlanComparison catalog={catalog} currentPlan={snap.plan} />
          </Paper>
        </Stack>
      ) : null}

      <Dialog open={confirmCancel} onClose={() => setConfirmCancel(false)}>
        <DialogTitle>Cancel subscription?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your plan stays active until the end of the current billing period
            {snap?.currentPeriodEnd ? ` (${fmtDate(snap.currentPeriodEnd)})` : ''}
            . After that it reverts to the Free plan. You can resume any time
            before then.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCancel(false)}>Keep plan</Button>
          <Button color="error" onClick={cancelSubscription}>
            Cancel at period end
          </Button>
        </DialogActions>
      </Dialog>
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
