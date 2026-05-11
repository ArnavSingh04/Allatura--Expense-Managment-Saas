'use client';

import {
  Alert,
  Box,
  CardContent,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { GitBranch } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import AppCard from '@/components/ui/AppCard';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import Money from '@/components/construction/Money';
import StatusChip from '@/components/construction/StatusChip';
import VariationDecisionDrawer from '@/components/construction/VariationDecisionDrawer';
import { authFetcher } from '@/lib/swr-fetcher';
import { keys } from '@/lib/swr-keys';
import {
  resolveMongoRefId,
  VARIATION_STATUSES,
  type Project,
  type Variation,
  type VariationStatus,
} from '@/types/construction';

function variationProjectLabel(v: Variation, projectById: Map<string, string>): string {
  const id = resolveMongoRefId(v.projectId);
  const mapped = id ? projectById.get(id) : undefined;
  if (mapped) return mapped;
  if (typeof v.projectId === 'object' && v.projectId !== null) {
    const { code, name } = v.projectId;
    const parts = [code, name].filter(Boolean);
    if (parts.length) return parts.join(' — ');
  }
  return id || '—';
}

export default function VariationsInboxPage() {
  const [statusFilter, setStatusFilter] = useState<VariationStatus | 'all'>(
    'Pending',
  );
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Variation | null>(null);

  const swrKey = useMemo(
    () =>
      keys.variationsInbox({
        status: statusFilter === 'all' ? undefined : statusFilter,
        projectId: projectFilter === 'all' ? undefined : projectFilter,
      }),
    [statusFilter, projectFilter],
  );

  const { data: projects } = useSWR<Project[]>(keys.projects(), authFetcher);
  const { data: vars, isLoading, error } = useSWR<Variation[]>(swrKey, authFetcher);

  const projectById = useMemo(
    () =>
      new Map((projects ?? []).map((p) => [p._id, `${p.code} — ${p.name}`])),
    [projects],
  );

  const refList = () => {
    void mutate(swrKey);
    void mutate(keys.companyDashboard());
  };

  const list = vars ?? [];

  return (
    <Box>
      <PageHeader
        title="Variations inbox"
        description="Approve, reject or chase change orders across every project."
      />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as VariationStatus | 'all')
          }
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">All</MenuItem>
          {VARIATION_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Project"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          sx={{ minWidth: 240 }}
        >
          <MenuItem value="all">All projects</MenuItem>
          {(projects ?? []).map((p) => (
            <MenuItem key={p._id} value={p._id}>
              {p.code} — {p.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(error as Error).message}
        </Alert>
      )}
      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {!isLoading && list.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="Nothing to action"
          description="No variations match the current filters."
        />
      ) : (
        <AppCard>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>VO</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Cost impact</TableCell>
                    <TableCell align="right">Days</TableCell>
                    <TableCell>Submitted</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((v) => {
                    const projectId = resolveMongoRefId(v.projectId);
                    const projectLabel = variationProjectLabel(v, projectById);
                    return (
                    <TableRow
                      key={v._id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setSelected(v)}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>{v.number}</TableCell>
                      <TableCell>
                        {projectId ? (
                          <Box
                            component={Link}
                            href={`/dashboard/projects/${projectId}/variations`}
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              color: 'primary.main',
                              textDecoration: 'none',
                              fontWeight: 500,
                            }}
                          >
                            {projectLabel}
                          </Box>
                        ) : (
                          <Typography component="span" variant="body2">
                            {projectLabel}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{v.title}</TableCell>
                      <TableCell>{v.reason}</TableCell>
                      <TableCell>
                        <StatusChip status={v.status} />
                      </TableCell>
                      <TableCell align="right">
                        <Money value={v.costImpact} bold />
                      </TableCell>
                      <TableCell align="right">{v.timeImpactDays}</TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {v.submittedAt
                            ? new Date(v.submittedAt).toLocaleDateString()
                            : '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </AppCard>
      )}

      <VariationDecisionDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        variation={selected}
        onChanged={refList}
      />
    </Box>
  );
}
