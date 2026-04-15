'use client';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import AppCard from '@/components/ui/AppCard';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { getStoredToken } from '@/lib/api-helper';
import { getJwtClaims } from '@/lib/jwt';
import { authFetcher } from '@/lib/swr-fetcher';

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
  const [canEdit, setCanEdit] = useState(false);
  const list = rows ?? [];
  const sorted = [...list].sort(
    (a, b) =>
      new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime(),
  );

  const loading = rows === undefined;
  const empty = rows !== undefined && list.length === 0;

  useEffect(() => {
    const role = getJwtClaims(getStoredToken())?.role;
    setCanEdit(role === 'admin' || role === 'editor');
  }, []);

  return (
    <Box>
      <PageHeader
        title="Contracts"
        description="Renewal pipeline sorted by date, stay ahead of auto-renew windows."
        action={canEdit ? (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            href="/dashboard/contracts/new"
            sx={{ fontWeight: 600 }}
          >
            Add contract
          </Button>
        ) : undefined}
      />

      <AppCard>
        <TableContainer sx={{ borderRadius: 2 }}>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell>System</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell>Billing cycle</TableCell>
                <TableCell>Renewal date</TableCell>
                <TableCell>Auto-renew</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
                    Loading contracts…
                  </TableCell>
                </TableRow>
              )}
              {empty && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ border: 'none', p: 0 }}>
                    <EmptyState
                      embedded
                      icon={FileText}
                      title="No contracts yet"
                      description="Link contracts to systems to track renewals and spend in one place."
                    />
                  </TableCell>
                </TableRow>
              )}
              {sorted.map((c) => (
                <TableRow key={c._id} hover sx={{ '&:last-child td': { borderBottom: 'none' } }}>
                  <TableCell sx={{ fontWeight: 600 }}>{c.systemId?.name ?? '-'}</TableCell>
                  <TableCell align="right">${c.costAmount.toLocaleString()}</TableCell>
                  <TableCell>{c.billingCycle}</TableCell>
                  <TableCell>{new Date(c.renewalDate).toLocaleDateString()}</TableCell>
                  <TableCell>{c.autoRenew ? 'Yes' : 'No'}</TableCell>
                  <TableCell align="right">
                    <IconButton component={Link} href={`/dashboard/contracts/${c._id}`} size="small" aria-label="View">
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    {canEdit ? (
                      <IconButton component={Link} href={`/dashboard/contracts/${c._id}/edit`} size="small" aria-label="Edit">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AppCard>
    </Box>
  );
}
