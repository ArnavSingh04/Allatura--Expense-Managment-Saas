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
import { FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import AppCard from '@/components/ui/AppCard';
import EmptyState from '@/components/ui/EmptyState';
import Money from '@/components/construction/Money';
import StatusChip from '@/components/construction/StatusChip';
import { authFetcher } from '@/lib/swr-fetcher';
import { keys } from '@/lib/swr-keys';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import type { Contract, Project, Subcontractor } from '@/types/construction';

export default function ProjectContractsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { can } = useAuthSession();
  const { data: project } = useSWR<Project>(
    id ? keys.project(id) : null,
    authFetcher,
  );
  const { data, error, isLoading } = useSWR<Contract[]>(
    id ? keys.contractsByProject(id) : null,
    authFetcher,
  );
  const { data: subbies } = useSWR<Subcontractor[]>(
    keys.subbies(),
    authFetcher,
  );

  if (error)
    return <Alert severity="error">{(error as Error).message}</Alert>;
  if (isLoading) return <LinearProgress />;

  const subbieById = new Map((subbies ?? []).map((s) => [s._id, s.name]));
  const deptById = new Map(
    (project?.departments ?? []).map((d) => [d._id, d.name]),
  );

  const contracts = data ?? [];

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Contracts ({contracts.length})
        </Typography>
        {can('contracts.create') && (
          <Button
            component={Link}
            href={`/dashboard/projects/${id}/contracts/new`}
            variant="contained"
            startIcon={<Plus size={16} />}
          >
            New contract
          </Button>
        )}
      </Stack>

      {contracts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No contracts yet"
          description={
            can('contracts.create')
              ? 'Add your first subcontractor contract — milestones, retention, and variations will track from here.'
              : 'Contracts assigned on this job will appear here.'
          }
        />
      ) : (
        <AppCard>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Reference</TableCell>
                    <TableCell>Subcontractor</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Original</TableCell>
                    <TableCell align="right">Current</TableCell>
                    <TableCell align="right">Retention</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contracts.map((c) => (
                    <TableRow key={c._id} hover>
                      <TableCell>
                        <Box
                          component={Link}
                          href={`/dashboard/projects/${id}/contracts/${c._id}`}
                          sx={{
                            fontWeight: 600,
                            color: 'primary.main',
                            textDecoration: 'none',
                          }}
                        >
                          {c.reference}
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {c.scope.slice(0, 80)}
                          {c.scope.length > 80 ? '…' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>{subbieById.get(c.subcontractorId) ?? '—'}</TableCell>
                      <TableCell>{deptById.get(c.departmentId) ?? '—'}</TableCell>
                      <TableCell>
                        <StatusChip status={c.status} />
                      </TableCell>
                      <TableCell align="right">
                        <Money value={c.originalValue} />
                      </TableCell>
                      <TableCell align="right">
                        <Money value={c.currentValue} bold />
                      </TableCell>
                      <TableCell align="right">{c.retentionPercent}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </AppCard>
      )}
    </Box>
  );
}
