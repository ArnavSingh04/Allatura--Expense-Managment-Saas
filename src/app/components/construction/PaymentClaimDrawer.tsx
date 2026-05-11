'use client';

import {
  Alert,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Check, DollarSign, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { ApiError } from '@/lib/api-client';
import { toMajor, toMinor } from '@/lib/money';
import { paymentClaimService } from '@/services/paymentClaimService';
import type { Contract, PaymentClaim } from '@/types/construction';
import Money from './Money';
import StatusChip from './StatusChip';

type Props = {
  open: boolean;
  onClose: () => void;
  claim: PaymentClaim | null;
  contracts: Contract[];
  onChanged?: () => void;
};

export default function PaymentClaimDrawer({
  open,
  onClose,
  claim,
  contracts,
  onChanged,
}: Props) {
  const { can } = useAuthSession();
  const [certifiedMajor, setCertifiedMajor] = useState('');
  const [retentionMajor, setRetentionMajor] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'certify' | 'reject' | 'pay' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const contract = useMemo(
    () => contracts.find((c) => c._id === claim?.contractId) ?? null,
    [contracts, claim],
  );

  useEffect(() => {
    if (!open || !claim) return;
    setCertifiedMajor(String(toMajor(claim.claimedAmount.amount)));
    const ret = contract
      ? Math.round(claim.claimedAmount.amount * (contract.retentionPercent / 100)) / 100
      : 0;
    setRetentionMajor(String(ret));
    setNote(claim.decisionNote ?? '');
    setError(null);
  }, [open, claim, contract]);

  if (!claim) return null;

  const currency = claim.claimedAmount.currency;
  const isOpen = ['Submitted', 'UnderReview'].includes(claim.status);
  const isCertified = claim.status === 'Certified';

  const certify = async () => {
    setError(null);
    setBusy('certify');
    try {
      await paymentClaimService.certify(claim._id, {
        certifiedAmount: { amount: toMinor(certifiedMajor), currency },
        retentionHeld: retentionMajor
          ? { amount: toMinor(retentionMajor), currency }
          : undefined,
        decisionNote: note.trim() || undefined,
      });
      onChanged?.();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not certify.');
    } finally {
      setBusy(null);
    }
  };

  const reject = async () => {
    setError(null);
    setBusy('reject');
    try {
      await paymentClaimService.reject(claim._id, note.trim() || undefined);
      onChanged?.();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reject.');
    } finally {
      setBusy(null);
    }
  };

  const markPaid = async () => {
    setError(null);
    setBusy('pay');
    try {
      await paymentClaimService.markPaid(
        claim._id,
        new Date().toISOString().slice(0, 10),
      );
      onChanged?.();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not mark paid.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}
    >
      <Box sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="overline" color="text.secondary">
            Claim {claim.claimNumber}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <X size={18} />
          </IconButton>
        </Stack>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {contract?.reference ?? 'Contract'}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2 }}>
          <StatusChip status={claim.status} />
          <Typography variant="body2" color="text.secondary">
            {new Date(claim.claimDate).toLocaleDateString()}
          </Typography>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack
          direction="row"
          divider={<Divider orientation="vertical" flexItem />}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Claimed
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              <Money value={claim.claimedAmount} bold />
            </Typography>
          </Box>
          {claim.certifiedAmount && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Certified
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                <Money value={claim.certifiedAmount} bold />
              </Typography>
            </Box>
          )}
          {claim.retentionHeld && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Retention held
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                <Money value={claim.retentionHeld} bold />
              </Typography>
            </Box>
          )}
        </Stack>

        <Divider sx={{ my: 2 }} />

        {isOpen && can('claims.certify') && (
          <Stack spacing={2}>
            <Typography variant="subtitle2">Certification</Typography>
            <Stack direction="row" spacing={1.5}>
              <TextField
                fullWidth
                label="Certified amount"
                type="number"
                value={certifiedMajor}
                onChange={(e) => setCertifiedMajor(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
              <TextField
                fullWidth
                label="Retention held"
                type="number"
                value={retentionMajor}
                onChange={(e) => setRetentionMajor(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Stack>
            <TextField
              fullWidth
              multiline
              minRows={2}
              placeholder="Decision note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Stack direction="row" spacing={1.5}>
              <Button
                fullWidth
                color="error"
                variant="outlined"
                startIcon={<X size={16} />}
                onClick={reject}
                disabled={busy !== null}
              >
                {busy === 'reject' ? 'Rejecting…' : 'Reject'}
              </Button>
              <Button
                fullWidth
                color="success"
                variant="contained"
                startIcon={<Check size={16} />}
                onClick={certify}
                disabled={busy !== null}
              >
                {busy === 'certify' ? 'Certifying…' : 'Certify'}
              </Button>
            </Stack>
          </Stack>
        )}

        {isCertified && can('claims.markPaid') && (
          <Button
            fullWidth
            variant="contained"
            startIcon={<DollarSign size={16} />}
            onClick={markPaid}
            disabled={busy !== null}
          >
            {busy === 'pay' ? 'Marking paid…' : 'Mark paid today'}
          </Button>
        )}

        {(claim.decisionNote || claim.paidAt) && (
          <Box sx={{ mt: 2 }}>
            {claim.decisionNote && (
              <Typography variant="body2" color="text.secondary">
                {claim.decisionNote}
              </Typography>
            )}
            {claim.paidAt && (
              <Typography variant="caption" color="text.secondary">
                Paid {new Date(claim.paidAt).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
