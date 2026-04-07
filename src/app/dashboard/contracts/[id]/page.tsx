'use client';

import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { authFetcher } from '@/lib/swr-fetcher';
import {
  dashboardHeader,
  dashboardSubheader,
} from '@/styles/MaterialStyles/shared/sharedStyles';

type ContractDoc = {
  costAmount: number;
  billingCycle: string;
  currency?: string;
  startDate: string;
  renewalDate: string;
  autoRenew: boolean;
  noticePeriodDays: number;
  expenseType: string;
  systemId?: { name?: string };
};

type RenewalRow = {
  _id: string;
  alertThresholdDays: number;
  status: string;
  decision?: string | null;
  sentAt?: string | null;
  contractId?: { _id?: string };
};

export default function ContractDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: c } = useSWR<ContractDoc>(
    id ? `contracts/${id}` : null,
    authFetcher,
  );
  const { data: renewals } = useSWR<RenewalRow[]>('renewals', authFetcher);
  const history = (renewals ?? []).filter(
    (r) => String((r.contractId as { _id?: string })?._id) === id,
  );

  if (!c) {
    return <Typography>Loading…</Typography>;
  }

  return (
    <Box>
      <Typography sx={dashboardHeader}>
        Contract, {c.systemId?.name ?? 'System'}
      </Typography>
      <Typography sx={dashboardSubheader}>
        {c.billingCycle} · {c.currency} · {c.expenseType}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        Cost: {c.costAmount} · Renewal: {new Date(c.renewalDate).toLocaleDateString()} ·
        Auto-renew: {c.autoRenew ? 'Yes' : 'No'} · Notice: {c.noticePeriodDays} days
      </Typography>
      <Button component={Link} href={`/dashboard/contracts/${id}/edit`} variant="outlined" sx={{ mt: 2 }}>
        Edit
      </Button>

      <Typography sx={{ ...dashboardHeader, mt: 3 }}>Renewal alert history</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Threshold (days)</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Decision</TableCell>
            <TableCell>Sent</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {history.map((h) => (
            <TableRow key={h._id}>
              <TableCell>{h.alertThresholdDays}</TableCell>
              <TableCell>{h.status}</TableCell>
              <TableCell>{h.decision ?? '-'}</TableCell>
              <TableCell>
                {h.sentAt ? new Date(h.sentAt).toLocaleString() : '-'}
              </TableCell>
            </TableRow>
          ))}
          {!history.length && (
            <TableRow>
              <TableCell colSpan={4}>No alerts yet</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
}
