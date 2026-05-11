'use client';

import {
  Alert,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/api-client';
import { variationService } from '@/services/variationService';
import type { Variation } from '@/types/construction';
import Money from './Money';
import StatusChip from './StatusChip';

type Props = {
  open: boolean;
  onClose: () => void;
  variation: Variation | null;
  onChanged?: () => void;
};

export default function VariationDecisionDrawer({
  open,
  onClose,
  variation,
  onChanged,
}: Props) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'approve' | 'reject' | 'submit' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNote(variation?.decisionNote ?? '');
      setError(null);
    }
  }, [open, variation]);

  if (!variation) return null;

  const decide = async (action: 'approve' | 'reject' | 'submit') => {
    setError(null);
    setBusy(action);
    try {
      if (action === 'approve') {
        await variationService.approve(variation._id, note.trim() || undefined);
      } else if (action === 'reject') {
        await variationService.reject(variation._id, note.trim() || undefined);
      } else {
        await variationService.submit(variation._id);
      }
      onChanged?.();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Action failed.');
    } finally {
      setBusy(null);
    }
  };

  const isPending = variation.status === 'Pending';
  const isDraft = variation.status === 'Draft';

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
            Variation {variation.number}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <X size={18} />
          </IconButton>
        </Stack>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {variation.title}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2 }}>
          <StatusChip status={variation.status} />
          <Typography variant="body2" color="text.secondary">
            {variation.reason}
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
              Cost impact
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              <Money value={variation.costImpact} bold />
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Time impact
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {variation.timeImpactDays}d
            </Typography>
          </Box>
        </Stack>

        {variation.description && (
          <>
            <Typography variant="overline" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
              {variation.description}
            </Typography>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {isPending ? 'Decision' : 'Decision note'}
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={3}
          placeholder="Reason for approval / rejection (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={!isPending && !isDraft}
        />

        <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
          {isDraft && (
            <Button
              fullWidth
              variant="outlined"
              onClick={() => decide('submit')}
              disabled={busy !== null}
            >
              {busy === 'submit' ? 'Submitting…' : 'Submit for approval'}
            </Button>
          )}
          {isPending && (
            <>
              <Button
                fullWidth
                color="error"
                variant="outlined"
                startIcon={<X size={16} />}
                onClick={() => decide('reject')}
                disabled={busy !== null}
              >
                {busy === 'reject' ? 'Rejecting…' : 'Reject'}
              </Button>
              <Button
                fullWidth
                color="success"
                variant="contained"
                startIcon={<Check size={16} />}
                onClick={() => decide('approve')}
                disabled={busy !== null}
              >
                {busy === 'approve' ? 'Approving…' : 'Approve'}
              </Button>
            </>
          )}
          {!isPending && !isDraft && (
            <Button fullWidth variant="outlined" onClick={onClose}>
              Close
            </Button>
          )}
        </Stack>

        {variation.decidedAt && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Decided {new Date(variation.decidedAt).toLocaleString()}
            {variation.decisionNote ? ` · ${variation.decisionNote}` : ''}
          </Typography>
        )}
      </Box>
    </Drawer>
  );
}
