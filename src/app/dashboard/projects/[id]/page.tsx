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
import Grid from '@mui/material/Grid';
import { CalendarClock, Receipt, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import AppCard from '@/components/ui/AppCard';
import KpiStatCard from '@/components/ui/KpiStatCard';
import BudgetBar from '@/components/construction/BudgetBar';
import Money from '@/components/construction/Money';
import StatusChip from '@/components/construction/StatusChip';
import { authFetcher } from '@/lib/swr-fetcher';
import { keys } from '@/lib/swr-keys';
import { ApiError } from '@/lib/api-client';
import { projectService } from '@/services/projectService';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import type { ProjectOverview } from '@/types/construction';

export default function ProjectOverviewPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { can } = useAuthSession();
  const { data, error, isLoading } = useSWR<ProjectOverview | null>(
    id ? keys.projectDashboard(id) : null,
    authFetcher,
  );
  const [recomputing, setRecomputing] = useState(false);
  const [recomputeError, setRecomputeError] = useState<string | null>(null);

  if (error) {
    return (
      <Alert severity="error">
        {String((error as Error).message ?? 'Failed to load project')}
      </Alert>
    );
  }
  if (isLoading || !data) {
    return <LinearProgress />;
  }

  const fin = data.financials;
  const currency = data.project.budget.currency;
  const budget = fin?.revisedBudget ?? data.project.budget;
  const committed = fin?.committedTotal ?? { amount: 0, currency };
  const paid = fin?.paidTotal ?? { amount: 0, currency };
  const variance = fin?.forecastVariance ?? { amount: 0, currency };
  const overdue = data.overdueDays;

  const recompute = async () => {
    if (!id) return;
    setRecomputeError(null);
    setRecomputing(true);
    try {
      await projectService.recomputeFinancials(id);
      await mutate(keys.projectDashboard(id));
      await mutate(keys.projectFinancials(id));
    } catch (e) {
      setRecomputeError(
        e instanceof ApiError ? e.message : 'Could not recompute financials.',
      );
    } finally {
      setRecomputing(false);
    }
  };

  return (
    <Box>
      {recomputeError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {recomputeError}
        </Alert>
      )}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <AppCard>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Budget vs spend
                </Typography>
                {can('projects.edit') && (
                  <Button
                    size="small"
                    startIcon={<RefreshCw size={14} />}
                    onClick={recompute}
                    disabled={recomputing}
                  >
                    {recomputing ? 'Recomputing…' : 'Recompute'}
                  </Button>
                )}
              </Stack>
              <BudgetBar budget={budget} committed={committed} paid={paid} />
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Stat label="Original budget" value={fin?.originalBudget ?? data.project.budget} />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Stat label="Approved variations" value={fin?.approvedVariations ?? { amount: 0, currency }} />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Stat label="Forecast final" value={fin?.forecastFinalCost ?? committed} />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Stat
                    label="Variance"
                    value={variance}
                    tone={variance.amount < 0 ? 'error' : variance.amount > 0 ? 'success' : 'default'}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </AppCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2.5} sx={{ height: '100%' }}>
            <KpiStatCard
              title="Pending variations"
              value={String(data.openVariationCount)}
              hint={`${data.approvedVariationCount} approved`}
              icon={Receipt}
              accent="amber"
            />
            <KpiStatCard
              title="Schedule"
              value={overdue > 0 ? `${overdue}d late` : 'On track'}
              hint={`Ends ${new Date(data.project.plannedEndDate).toLocaleDateString()}`}
              icon={CalendarClock}
              accent={overdue > 0 ? 'rose' : 'teal'}
            />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <AppCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                Departments
              </Typography>
              {data.departmentSummary.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No departments yet — add some from the project settings.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {data.departmentSummary.map((d) => (
                    <Box key={d.departmentId}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {d.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {d.type} · {d.percentComplete}% complete
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          <Money value={d.committed} compact />
                          <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                            {' '}
                            of{' '}
                          </Box>
                          <Money value={d.budget} compact />
                        </Typography>
                      </Stack>
                      <Box sx={{ mt: 1 }}>
                        <BudgetBar size="sm" budget={d.budget} committed={d.committed} paid={d.paid} />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={d.percentComplete}
                        sx={{ mt: 0.75, height: 4, borderRadius: 2 }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </AppCard>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <AppCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                Upcoming payments
              </Typography>
              {data.upcomingMilestones.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nothing due in the next 30 days.
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {data.upcomingMilestones.map((m) => (
                    <Box
                      key={m.milestoneId}
                      sx={{
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {m.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {m.contractRef} · due {new Date(m.dueDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <StatusChip status={m.status} />
                          <Money value={m.amount} bold />
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </AppCard>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <AppCard>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Recent variations
                </Typography>
                <Button
                  size="small"
                  component={Link}
                  href={`/dashboard/projects/${id}/variations`}
                >
                  View all
                </Button>
              </Stack>
              {data.recentVariations.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No variations recorded yet.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Number</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Cost impact</TableCell>
                        <TableCell align="right">Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.recentVariations.map((v) => (
                        <TableRow key={v._id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{v.number}</TableCell>
                          <TableCell>{v.title}</TableCell>
                          <TableCell>{v.reason}</TableCell>
                          <TableCell>
                            <StatusChip status={v.status} />
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: v.costImpact.amount < 0 ? 'success.main' : 'text.primary',
                              fontWeight: 600,
                            }}
                          >
                            <Money value={v.costImpact} />
                          </TableCell>
                          <TableCell align="right">
                            {v.timeImpactDays > 0 ? `+${v.timeImpactDays}d` : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </AppCard>
        </Grid>
      </Grid>
    </Box>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: { amount: number; currency: string };
  tone?: 'default' | 'success' | 'error';
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color:
            tone === 'success'
              ? 'success.main'
              : tone === 'error'
                ? 'error.main'
                : 'text.primary',
        }}
      >
        <Money value={value} />
      </Typography>
    </Box>
  );
}
