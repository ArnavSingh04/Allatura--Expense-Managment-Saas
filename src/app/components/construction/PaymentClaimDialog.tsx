'use client';

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/lib/api-client';
import { toMajor, toMinor } from '@/lib/money';
import { paymentClaimService } from '@/services/paymentClaimService';
import type { Contract, PaymentClaim } from '@/types/construction';

type Props = {
  open: boolean;
  onClose: () => void;
  contracts: Contract[];
  defaultContractId?: string;
  currency?: string;
  onCreated?: (c: PaymentClaim) => void;
};

const today = () => new Date().toISOString().slice(0, 10);

export default function PaymentClaimDialog({
  open,
  onClose,
  contracts,
  defaultContractId,
  currency = 'AUD',
  onCreated,
}: Props) {
  const [contractId, setContractId] = useState(defaultContractId ?? '');
  const [milestoneId, setMilestoneId] = useState<string>('');
  const [claimNumber, setClaimNumber] = useState('');
  const [claimDate, setClaimDate] = useState(today());
  const [amountMajor, setAmountMajor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setContractId(defaultContractId ?? contracts[0]?._id ?? '');
    setMilestoneId('');
    setClaimNumber('');
    setClaimDate(today());
    setAmountMajor('');
    setError(null);
  }, [open, defaultContractId, contracts]);

  const contract = useMemo(
    () => contracts.find((c) => c._id === contractId) ?? null,
    [contracts, contractId],
  );

  const onSelectMilestone = (mId: string) => {
    setMilestoneId(mId);
    if (!mId) return;
    const m = contract?.paymentMilestones.find((x) => x._id === mId);
    if (m) setAmountMajor(String(toMajor(m.amount.amount)));
  };

  const submit = async () => {
    setError(null);
    if (!contractId || !claimNumber.trim() || !amountMajor) {
      setError('Contract, claim number and amount are required.');
      return;
    }
    setBusy(true);
    try {
      const claim = await paymentClaimService.submit({
        contractId,
        milestoneId: milestoneId || null,
        claimNumber: claimNumber.trim(),
        claimDate,
        claimedAmount: { amount: toMinor(amountMajor), currency },
      });
      onCreated?.(claim);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not submit claim.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 6 }}>
        Submit payment claim
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Builders / subcontractors raise a claim, finance certifies and pays.
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
          size="small"
        >
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Stack spacing={2}>
          <TextField
            select
            fullWidth
            required
            label="Contract"
            value={contractId}
            onChange={(e) => {
              setContractId(e.target.value);
              setMilestoneId('');
            }}
            disabled={!!defaultContractId}
          >
            {contracts.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.reference}
              </MenuItem>
            ))}
          </TextField>

          {contract && contract.paymentMilestones.length > 0 && (
            <TextField
              select
              fullWidth
              label="Against milestone"
              value={milestoneId}
              onChange={(e) => onSelectMilestone(e.target.value)}
              helperText="Optional — picking one auto-fills the amount."
            >
              <MenuItem value="">— None —</MenuItem>
              {contract.paymentMilestones.map((m) => (
                <MenuItem key={m._id} value={m._id} disabled={m.status === 'Paid'}>
                  {m.name} · {m.percentOfContract}% · {m.status}
                </MenuItem>
              ))}
            </TextField>
          )}

          <Stack direction="row" spacing={1.5}>
            <TextField
              fullWidth
              required
              label="Claim #"
              value={claimNumber}
              onChange={(e) => setClaimNumber(e.target.value)}
              placeholder="PC-001"
            />
            <TextField
              fullWidth
              label="Claim date"
              type="date"
              value={claimDate}
              onChange={(e) => setClaimDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <TextField
            fullWidth
            required
            label={`Claimed amount (${currency})`}
            type="number"
            value={amountMajor}
            onChange={(e) => setAmountMajor(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={submit} disabled={busy}>
          {busy ? 'Submitting…' : 'Submit claim'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
