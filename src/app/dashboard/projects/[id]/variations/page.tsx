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
import { Check, ClipboardList, GitBranch, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import AppCard from '@/components/ui/AppCard';
import EmptyState from '@/components/ui/EmptyState';
import KpiStatCard from '@/components/ui/KpiStatCard';
import Money from '@/components/construction/Money';
import StatusChip from '@/components/construction/StatusChip';
import VariationDecisionDrawer from '@/components/construction/VariationDecisionDrawer';
import VariationDialog from '@/components/construction/VariationDialog';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { addMoney, formatMoney } from '@/lib/money';
import { authFetcher } from '@/lib/swr-fetcher';
import { keys } from '@/lib/swr-keys';
import type { Contract, Project, Variation } from '@/types/construction';

export default function ProjectVariationsPage() {
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
  const { data: vars, isLoading, error } = useSWR<Variation[]>(
    id ? keys.variationsInbox({ projectId: id }) : null,
    authFetcher,
  );

  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Variation | null>(null);

  const refList = () =>
    void Promise.all([
      mutate(keys.variationsInbox({ projectId: id })),
      mutate(keys.projectFinancials(id)),
      mutate(keys.projectDashboard(id)),
      mutate(keys.contractsByProject(id)),
    ]);

  const contractRefById = useMemo(
    () => new Map((contracts ?? []).map((c) => [c._id, c.reference])),
    [contracts],
  );

  const summary = useMemo(() => {
    const list = vars ?? [];
    const currency = project?.budget.currency ?? 'AUD';
    const zero = { amount: 0, currency };
    const approved = list
      .filter((v) => v.status === 'Approved')
      .reduce((acc, v) => addMoney(acc, v.costImpact), zero);
    const pending = list
      .filter((v) => v.status === 'Pending')
      .reduce((acc, v) => addMoney(acc, v.costImpact), zero);
    return {
      total: list.length,
      pendingCount: list.filter((v) => v.status === 'Pending').length,
      approvedCount: list.filter((v) => v.status === 'Approved').length,
      approved,
      pending,
    };
  }, [vars, project]);

  if (error)
    return <Alert severity="error">{(error as Error).message}</Alert>;
  if (isLoading) return <LinearProgress />;

  const list = vars ?? [];

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Variations ({list.length})
        </Typography>
        {can('variations.create') && (contracts?.length ?? 0) > 0 && (
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => setCreating(true)}
          >
            New variation
          </Button>
        )}
      </Stack>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Box sx={{ flex: 1 }}>
          <KpiStatCard
            title="Pending decision"
            value={String(summary.pendingCount)}
            hint={formatMoney(summary.pending)}
            icon={ClipboardList}
            accent="amber"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <KpiStatCard
            title="Approved"
            value={String(summary.approvedCount)}
            hint={formatMoney(summary.approved)}
            icon={Check}
            accent="teal"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <KpiStatCard
            title="Total raised"
            value={String(summary.total)}
            hint="All variations on this project"
            icon={GitBranch}
            accent="violet"
          />
        </Box>
      </Stack>

      {list.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No variations on this project"
          description={
            can('variations.create')
              ? 'Track every change order against a contract — approval automatically updates project budget.'
              : 'Variations will appear here once raised.'
          }
          actionLabel={can('variations.create') ? 'New variation' : undefined}
          onAction={
            can('variations.create') && (contracts?.length ?? 0) > 0
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
                    <TableCell>VO</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Contract</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Cost impact</TableCell>
                    <TableCell align="right">Days</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((v) => (
                    <TableRow
                      key={v._id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setSelected(v)}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>{v.number}</TableCell>
                      <TableCell>
                        {v.title}
                        {v.description && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            {v.description.slice(0, 80)}
                            {v.description.length > 80 ? '…' : ''}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {contractRefById.get(v.contractId) ?? '—'}
                      </TableCell>
                      <TableCell>{v.reason}</TableCell>
                      <TableCell>
                        <StatusChip status={v.status} />
                      </TableCell>
                      <TableCell align="right">
                        <Money value={v.costImpact} bold />
                      </TableCell>
                      <TableCell align="right">{v.timeImpactDays}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </AppCard>
      )}

      <VariationDialog
        open={creating}
        onClose={() => setCreating(false)}
        contracts={contracts ?? []}
        currency={project?.budget.currency}
        onCreated={refList}
      />
      <VariationDecisionDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        variation={selected}
        onChanged={refList}
      />
    </Box>
  );
}
