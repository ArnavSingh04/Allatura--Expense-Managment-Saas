'use client';

import {
  Alert,
  Box,
  Button,
  CardContent,
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { GanttChartSquare, Plus, Search } from 'lucide-react';
import AppCard from '@/components/ui/AppCard';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import StatusChip from '@/components/construction/StatusChip';
import BudgetBar from '@/components/construction/BudgetBar';
import Money from '@/components/construction/Money';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { authFetcher } from '@/lib/swr-fetcher';
import { keys } from '@/lib/swr-keys';
import { PROJECT_STATUSES, type Project, type ProjectFinancials } from '@/types/construction';

export default function ProjectsListPage() {
  const { can } = useAuthSession();
  const router = useRouter();
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');

  const swrKey = useMemo(
    () => keys.projects({ status: status || undefined, q: search || undefined }),
    [status, search],
  );

  const { data, error, isLoading } = useSWR<Project[]>(swrKey, authFetcher);

  const projects = data ?? [];

  return (
    <Box>
      <PageHeader
        title="Projects"
        description="Every job in flight — drill into any one for budget, contracts, expenses, and progress."
        action={
          can('projects.create') ? (
            <Button
              component={Link}
              href="/dashboard/projects/new"
              variant="contained"
              startIcon={<Plus size={16} />}
            >
              New project
            </Button>
          ) : null
        }
      />

      <AppCard sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by code, name, client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <Search size={16} style={{ marginRight: 8 }} />,
              }}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="">All statuses</MenuItem>
              {PROJECT_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </AppCard>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {String((error as Error).message ?? 'Failed to load projects')}
        </Alert>
      )}

      {!isLoading && projects.length === 0 ? (
        <EmptyState
          icon={GanttChartSquare}
          title="No projects yet"
          description={
            can('projects.create')
              ? 'Spin up your first construction project to start tracking budget, contracts, and progress.'
              : 'Once a project is created, it will appear here.'
          }
          actionLabel={can('projects.create') ? 'Create project' : undefined}
          onAction={
            can('projects.create')
              ? () => router.push('/dashboard/projects/new')
              : undefined
          }
        />
      ) : (
        <AppCard>
          <TableContainer>
            <Table size="medium">
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Budget vs spend</TableCell>
                  <TableCell align="right">Budget</TableCell>
                  <TableCell align="right">Due</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((p) => (
                  <ProjectRow key={p._id} project={p} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AppCard>
      )}
    </Box>
  );
}

function ProjectRow({ project }: { project: Project }) {
  const { data: fin } = useSWR<ProjectFinancials | null>(
    keys.projectFinancials(project._id),
    authFetcher,
  );
  const committed = fin?.committedTotal ?? { amount: 0, currency: project.budget.currency };
  const paid = fin?.paidTotal ?? { amount: 0, currency: project.budget.currency };
  const budget = fin?.revisedBudget ?? project.budget;

  return (
    <TableRow hover>
      <TableCell>
        <Box
          component={Link}
          href={`/dashboard/projects/${project._id}`}
          sx={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            {project.code}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {project.name}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2">{project.client || '—'}</Typography>
        <Typography variant="caption" color="text.secondary">
          {project.siteAddress || ''}
        </Typography>
      </TableCell>
      <TableCell>
        <StatusChip status={project.status} />
      </TableCell>
      <TableCell sx={{ minWidth: 220 }}>
        <BudgetBar size="sm" budget={budget} committed={committed} paid={paid} />
      </TableCell>
      <TableCell align="right">
        <Money value={budget} bold />
      </TableCell>
      <TableCell align="right">
        {new Date(project.plannedEndDate).toLocaleDateString()}
      </TableCell>
    </TableRow>
  );
}
