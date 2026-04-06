'use client';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { ApiHelper, REQUEST_TYPE } from '@/lib/api-helper';
import { authFetcher } from '@/lib/swr-fetcher';
import {
  dashboardHeader,
  dashboardSubheader,
} from '@/styles/MaterialStyles/shared/sharedStyles';

const MILESTONES = [120, 90, 60, 30, 7];

type RenewalDetail = {
  _id: string;
  alertThresholdDays: number;
  status: string;
  decision?: string | null;
  contractId?: {
    costAmount?: number;
    autoRenew?: boolean;
    renewalDate?: string;
    billingCycle?: string;
    systemId?: { name?: string; vendor?: string };
  };
};

type RenewalListItem = {
  _id: string;
  alertThresholdDays: number;
  status: string;
  contractId?: { _id?: string };
};

export default function RenewalDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: detail, mutate } = useSWR<RenewalDetail>(
    id ? `renewals/${id}` : null,
    authFetcher,
  );
  const contractId = useMemo(() => {
    const c = detail?.contractId as { _id?: string } | undefined;
    return c?._id ? String(c._id) : null;
  }, [detail]);
  const { data: allAlerts } = useSWR<RenewalListItem[]>('renewals', authFetcher);

  const related = useMemo(() => {
    if (!contractId) {
      return [];
    }
    return (allAlerts ?? []).filter(
      (a) => String((a.contractId as { _id?: string })?._id) === contractId,
    );
  }, [allAlerts, contractId]);

  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<'Renew' | 'Cancel' | 'Renegotiate'>(
    'Renew',
  );
  const [note, setNote] = useState('');

  const submitDecision = async () => {
    const api = new ApiHelper(`renewals/${id}`);
    api.urlParams = 'decision';
    api.includeKey = false;
    api.type = REQUEST_TYPE.PATCH;
    api.body = { decision, decisionNote: note };
    const res = (await api.fetchRequest()) as { failed?: boolean };
    if (!res?.failed) {
      setOpen(false);
      void mutate();
    }
  };

  if (!detail) {
    return <Typography>Loading…</Typography>;
  }

  const c = detail.contractId;

  return (
    <Box>
      <Typography sx={dashboardHeader}>Renewal alert</Typography>
      <Typography sx={dashboardSubheader}>
        Threshold {detail.alertThresholdDays} days · {detail.status}
      </Typography>

      <Box sx={{ mt: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
        <Typography variant="subtitle1">Contract</Typography>
        <Typography variant="body2">
          {c?.systemId?.name} · {c?.systemId?.vendor}
        </Typography>
        <Typography variant="body2">
          Cost {c?.costAmount} · {c?.billingCycle} · Renewal{' '}
          {c?.renewalDate ? new Date(c.renewalDate).toLocaleDateString() : '—'} ·
          Auto-renew {c?.autoRenew ? 'Yes' : 'No'}
        </Typography>
      </Box>

      <Typography sx={{ ...dashboardHeader, mt: 3 }}>Milestone timeline</Typography>
      <ul>
        {MILESTONES.map((m) => {
          const hit = related.find((r) => r.alertThresholdDays === m);
          return (
            <li key={m}>
              {m} days: {hit ? hit.status : '—'}
            </li>
          );
        })}
      </ul>

      <Button variant="contained" onClick={() => setOpen(true)} sx={{ mt: 1 }}>
        Log decision
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Confirm decision</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 2 }}>
            {(['Renew', 'Cancel', 'Renegotiate'] as const).map((d) => (
              <Button
                key={d}
                variant={decision === d ? 'contained' : 'outlined'}
                onClick={() => setDecision(d)}
              >
                {d}
              </Button>
            ))}
          </Box>
          <TextField
            label="Note (optional)"
            fullWidth
            multiline
            minRows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => void submitDecision()} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
