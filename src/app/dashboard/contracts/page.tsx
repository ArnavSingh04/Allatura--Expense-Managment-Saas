'use client';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Box,
  Button,
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

type ContractRow = {
  _id: string;
  costAmount: number;
  billingCycle: string;
  renewalDate: string;
  autoRenew: boolean;
  systemId?: { name?: string };
};

export default function ContractsPage() {
  const { data: rows } = useSWR<ContractRow[]>('contracts', authFetcher);
  const sorted = [...(rows ?? [])].sort(
    (a, b) =>
      new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime(),
  );

  return (
    <Box>
      <Typography sx={dashboardHeader}>Contracts</Typography>
      <Typography sx={dashboardSubheader} gutterBottom>
        Sorted by renewal date
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        component={Link}
        href="/dashboard/contracts/new"
        sx={{ mb: 2 }}
      >
        Add contract
      </Button>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>System</TableCell>
            <TableCell align="right">Cost</TableCell>
            <TableCell>Billing cycle</TableCell>
            <TableCell>Renewal date</TableCell>
            <TableCell>Auto-renew</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((c) => (
            <TableRow key={c._id}>
              <TableCell>{c.systemId?.name ?? '—'}</TableCell>
              <TableCell align="right">{c.costAmount}</TableCell>
              <TableCell>{c.billingCycle}</TableCell>
              <TableCell>{new Date(c.renewalDate).toLocaleDateString()}</TableCell>
              <TableCell>{c.autoRenew ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <IconButton component={Link} href={`/dashboard/contracts/${c._id}`} size="small">
                  <VisibilityIcon fontSize="small" />
                </IconButton>
                <IconButton component={Link} href={`/dashboard/contracts/${c._id}/edit`} size="small">
                  <EditIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
