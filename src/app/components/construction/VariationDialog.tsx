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
import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/api-client';
import { toMinor } from '@/lib/money';
import {
  variationService,
  type CreateVariationInput,
} from '@/services/variationService';
import {
  VARIATION_REASONS,
  type Contract,
  type VariationReason,
} from '@/types/construction';

type Props = {
  open: boolean;
  onClose: () => void;
  contracts: Contract[];
  defaultContractId?: string;
  currency?: string;
  onCreated?: () => void;
};

export default function VariationDialog({
  open,
  onClose,
  contracts,
  defaultContractId,
  currency = 'AUD',
  onCreated,
}: Props) {
  const [contractId, setContractId] = useState(defaultContractId ?? '');
  const [number, setNumber] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState<VariationReason>('ClientRequest');
  const [costMajor, setCostMajor] = useState('');
  const [timeImpact, setTimeImpact] = useState('0');
  const [submit, setSubmit] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setContractId(defaultContractId ?? contracts[0]?._id ?? '');
    setNumber('');
    setTitle('');
    setDescription('');
    setReason('ClientRequest');
    setCostMajor('');
    setTimeImpact('0');
    setSubmit(true);
    setError(null);
  }, [open, defaultContractId, contracts]);

  const handleSave = async () => {
    setError(null);
    if (!contractId || !number.trim() || !title.trim() || costMajor === '') {
      setError('Contract, VO number, title and cost impact are required.');
      return;
    }
    setBusy(true);
    try {
      const input: CreateVariationInput = {
        number: number.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        reason,
        costImpact: { amount: toMinor(costMajor), currency },
        timeImpactDays: Number(timeImpact) || 0,
      };
      const v = await variationService.create(contractId, input);
      if (submit) {
        await variationService.submit(v._id);
      }
      onCreated?.();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not create variation.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 6 }}>
        New variation
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Variations adjust contract value & forecast budget on approval.
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
            onChange={(e) => setContractId(e.target.value)}
            disabled={!!defaultContractId}
          >
            {contracts.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.reference} — {c.scope.slice(0, 60)}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={1.5}>
            <TextField
              fullWidth
              label="VO number"
              required
              placeholder="VO-001"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
            <TextField
              fullWidth
              select
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as VariationReason)}
            >
              {VARIATION_REASONS.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <TextField
            fullWidth
            label="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Description"
            placeholder="Scope of change, why it's needed, who initiated…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Stack direction="row" spacing={1.5}>
            <TextField
              fullWidth
              required
              label={`Cost impact (${currency})`}
              type="number"
              value={costMajor}
              onChange={(e) => setCostMajor(e.target.value)}
              helperText="Use negative for credits."
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Time impact"
              type="number"
              value={timeImpact}
              onChange={(e) => setTimeImpact(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">days</InputAdornment>,
              }}
            />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <input
              id="submit-now"
              type="checkbox"
              checked={submit}
              onChange={(e) => setSubmit(e.target.checked)}
            />
            <label htmlFor="submit-now">
              <Typography variant="body2" color="text.secondary">
                Submit for approval immediately (otherwise saved as draft)
              </Typography>
            </label>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={busy}>
          {busy ? 'Saving…' : submit ? 'Create & submit' : 'Save draft'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
