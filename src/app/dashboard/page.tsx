'use client';

import {
  Alert,
  Box,
  Button,
  CardContent,
  Chip,
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
import Link from 'next/link';
import useSWR from 'swr';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  GanttChartSquare,
  Wallet,
} from 'lucide-react';
import AppCard from '@/components/ui/AppCard';
import KpiStatCard from '@/components/ui/KpiStatCard';
import PageHeader from '@/components/ui/PageHeader';
import BudgetBar from '@/components/construction/BudgetBar';
import StatusChip from '@/components/construction/StatusChip';
import { authFetcher } from '@/lib/swr-fetcher';
import { keys } from '@/lib/swr-keys';
import { formatMoney } from '@/lib/money';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import type { CompanyOverview } from '@/types/construction';

export default function CompanyDashboardPage() {
  const { can } = useAuthSession();
  const { data, error, isLoading } = useSWR<CompanyOverview>(
    keys.companyDashboard(),
    authFetcher,
  );

  const totals = data ?? {
    projectCount: 0,
    activeCount: 0,
    completedCount: 0,
    onHoldCount: 0,
    totalBudget: { amount: 0, currency: 'AUD' },
    totalCommitted: { amount: 0, currency: 'AUD' },
    totalPaid: { amount: 0, currency: 'AUD' },
    pendingVariations: 0,
    openPaymentClaims: 0,
    projectsAtRisk: [],
  };

  return (
    <Box>
      <PageHeader
        title="Company overview"
        description="Live snapshot of every job — budget, spend, exposure, and what needs you next."
        action={
          can('projects.create') ? (
            <Button
              variant="contained"
              component={Link}
              href="/dashboard/projects/new"
              startIcon={<GanttChartSquare size={16} />}
            >
              New project
            </Button>
          ) : null
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load dashboard. {String((error as Error).message ?? '')}
        </Alert>
      )}

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiStatCard
            title="Active jobs"
            value={isLoading ? '…' : String(totals.activeCount)}
            hint={`${totals.projectCount} total · ${totals.completedCount} done`}
            icon={GanttChartSquare}
            accent="teal"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiStatCard
            title="Total budget"
            value={isLoading ? '…' : formatMoney(totals.totalBudget)}
            hint={`Paid ${formatMoney(totals.totalPaid)}`}
            icon={Wallet}
            accent="violet"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiStatCard
            title="Pending variations"
            value={isLoading ? '…' : String(totals.pendingVariations)}
            hint="Need a decision"
            icon={ClipboardList}
            accent="amber"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiStatCard
            title="Open payment claims"
            value={isLoading ? '…' : String(totals.openPaymentClaims)}
            hint="Awaiting certification or payment"
            icon={CheckCircle2}
            accent="rose"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <AppCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Portfolio spend
              </Typography>
              <BudgetBar
                budget={totals.totalBudget}
                committed={totals.totalCommitted}
                paid={totals.totalPaid}
              />
              <Stack direction="row" spacing={3} sx={{ mt: 2.5, color: 'text.secondary' }}>
                <Box>
                  <Typography variant="caption">Active</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {totals.activeCount}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption">On hold</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {totals.onHoldCount}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption">Completed</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {totals.completedCount}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </AppCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <AppCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                Projects at risk
              </Typography>
              {totals.projectsAtRisk.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <CheckCircle2 size={36} strokeWidth={1.5} style={{ opacity: 0.5 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', mt: 1 }}>
                    Nothing on fire
                  </Typography>
                  <Typography variant="caption">
                    Every project is on schedule and on budget.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.25}>
                  {totals.projectsAtRisk.map((p) => (
                    <Box
                      key={p.id}
                      component={Link}
                      href={`/dashboard/projects/${p.id}`}
                      sx={{
                        display: 'block',
                        textDecoration: 'none',
                        color: 'inherit',
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {p.code} — {p.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {p.lateDays > 0 ? `${p.lateDays}d late · ` : ''}
                            {p.overrunPercent > 0
                              ? `${p.overrunPercent}% over budget`
                              : 'Forecast over budget'}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {p.lateDays > 0 && (
                            <Chip
                              icon={<AlertTriangle size={12} />}
                              label="Late"
                              size="small"
                              color="error"
                            />
                          )}
                          <StatusChip status={p.status} />
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
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1.5 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Watchlist
                </Typography>
                <Button
                  component={Link}
                  href="/dashboard/projects"
                  size="small"
                >
                  View all projects
                </Button>
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Project</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Variance</TableCell>
                      <TableCell align="right">Due</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {totals.projectsAtRisk.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell>
                          <Box
                            component={Link}
                            href={`/dashboard/projects/${p.id}`}
                            sx={{
                              fontWeight: 600,
                              color: 'primary.main',
                              textDecoration: 'none',
                            }}
                          >
                            {p.code} — {p.name}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={p.status} />
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: p.variance < 0 ? 'error.main' : 'success.main',
                            fontWeight: 600,
                          }}
                        >
                          {formatMoney({
                            amount: p.variance,
                            currency: totals.totalBudget.currency,
                          })}
                        </TableCell>
                        <TableCell align="right">
                          {new Date(p.plannedEndDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {totals.projectsAtRisk.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          Nothing to flag.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </AppCard>
        </Grid>
      </Grid>
    </Box>
  );
}
