'use client';

import {
  Alert,
  Box,
  Button,
  CardContent,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Banknote, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import AppCard from '@/components/ui/AppCard';
import EmptyState from '@/components/ui/EmptyState';
import Money from '@/components/construction/Money';
import PaymentClaimDialog from '@/components/construction/PaymentClaimDialog';
import PaymentClaimDrawer from '@/components/construction/PaymentClaimDrawer';
import StatusChip from '@/components/construction/StatusChip';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { authFetcher } from '@/lib/swr-fetcher';
import { keys } from '@/lib/swr-keys';
import type { Contract, PaymentClaim, Project } from '@/types/construction';

export default function ProjectPaymentClaimsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { can } = useAuthSession();

  const { data: project } = useSWR<Project>(
    id ? keys.project(id) : null,
    authFetcher,
  );
  const { data: contracts } = useSWR<Contract[]>(
    id ? keys.contractsByProject(id) : null,
    authFetcher,
  );
  const { data: claims, isLoading, error } = useSWR<PaymentClaim[]>(
    id ? keys.claimsByProject(id) : null,
    authFetcher,
  );

  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<PaymentClaim | null>(null);

  const refresh = () =>
    void Promise.all([
      mutate(keys.claimsByProject(id)),
      mutate(keys.projectFinancials(id)),
      mutate(keys.projectDashboard(id)),
      mutate(keys.contractsByProject(id)),
    ]);

  const contractRefById = useMemo(
    () => new Map((contracts ?? []).map((c) => [c._id, c.reference])),
    [contracts],
  );

  if (error)
    return <Alert severity="error">{(error as Error).message}</Alert>;
  if (isLoading) return <LinearProgress />;

  const list = claims ?? [];

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Payment claims ({list.length})
        </Typography>
        {can('claims.submit') && (contracts?.length ?? 0) > 0 && (
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => setCreating(true)}
          >
            New claim
          </Button>
        )}
      </Stack>

      {list.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="No payment claims yet"
          description={
            can('claims.submit')
              ? 'Subbies submit claims against contracts and milestones; finance certifies and marks paid.'
              : 'Claims raised against this job will appear here.'
          }
          actionLabel={can('claims.submit') ? 'New claim' : undefined}
          onAction={
            can('claims.submit') && (contracts?.length ?? 0) > 0
              ? () => setCreating(true)
              : undefined
          }
        />
      ) : (
        <AppCard>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Claim #</TableCell>
                    <TableCell>Contract</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Claimed</TableCell>
                    <TableCell align="right">Certified</TableCell>
                    <TableCell align="right">Retention</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((c) => (
                    <TableRow
                      key={c._id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setSelected(c)}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>{c.claimNumber}</TableCell>
                      <TableCell>{contractRefById.get(c.contractId) ?? '—'}</TableCell>
                      <TableCell>
                        {new Date(c.claimDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <StatusChip status={c.status} />
                      </TableCell>
                      <TableCell align="right">
                        <Money value={c.claimedAmount} />
                      </TableCell>
                      <TableCell align="right">
                        <Money value={c.certifiedAmount} bold />
                      </TableCell>
                      <TableCell align="right">
                        <Money value={c.retentionHeld} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </AppCard>
      )}

      <PaymentClaimDialog
        open={creating}
        onClose={() => setCreating(false)}
        contracts={contracts ?? []}
        currency={project?.budget.currency}
        onCreated={refresh}
      />
      <PaymentClaimDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        claim={selected}
        contracts={contracts ?? []}
        onChanged={refresh}
      />
    </Box>
  );
}
