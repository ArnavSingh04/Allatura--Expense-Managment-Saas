'use client';

import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import useSWR from 'swr';
import { authFetcher } from '@/lib/swr-fetcher';
import {
  dashboardHeader,
  dashboardSubheader,
} from '@/styles/MaterialStyles/shared/sharedStyles';

type RenewalRow = {
  _id: string;
  daysRemaining: number;
  status: string;
  decision?: string | null;
  contractId?: {
    costAmount?: number;
    autoRenew?: boolean;
    renewalDate?: string;
    systemId?: {
      name?: string;
      businessOwner?: { name?: string; email?: string };
    };
  };
};

export default function RenewalsPage() {
  const { data: rows } = useSWR<RenewalRow[]>(
    'renewals?upcoming=true',
    authFetcher,
  );
  const sorted = [...(rows ?? [])].sort(
    (a, b) => a.daysRemaining - b.daysRemaining,
  );

  return (
    <Box>
      <Typography sx={dashboardHeader}>Renewals</Typography>
      <Typography sx={dashboardSubheader} gutterBottom>
        Alerts and decisions
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>System</TableCell>
            <TableCell>Renewal date</TableCell>
            <TableCell>Days remaining</TableCell>
            <TableCell align="right">Cost</TableCell>
            <TableCell>Owner</TableCell>
            <TableCell>Auto-renew</TableCell>
            <TableCell>Decision</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((r) => {
            const sys = r.contractId?.systemId;
            const rd = r.contractId?.renewalDate;
            return (
              <TableRow key={r._id}>
                <TableCell>{sys?.name ?? '-'}</TableCell>
                <TableCell>
                  {rd ? new Date(rd).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell>{r.daysRemaining}</TableCell>
                <TableCell align="right">{r.contractId?.costAmount ?? '-'}</TableCell>
                <TableCell>
                  {sys?.businessOwner?.name || sys?.businessOwner?.email || '-'}
                </TableCell>
                <TableCell>{r.contractId?.autoRenew ? 'Yes' : 'No'}</TableCell>
                <TableCell>{r.decision ?? r.status}</TableCell>
                <TableCell>
                  <IconButton component={Link} href={`/dashboard/renewals/${r._id}`} size="small">
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}
