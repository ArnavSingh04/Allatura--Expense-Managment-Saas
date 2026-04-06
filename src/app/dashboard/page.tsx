'use client';

import {
  Box,
  CardContent,
  Chip,
  Link as MuiLink,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  CalendarClock,
  DollarSign,
  Layers,
} from 'lucide-react';
import AppCard from '@/components/ui/AppCard';
import KpiStatCard from '@/components/ui/KpiStatCard';
import PageHeader from '@/components/ui/PageHeader';
import { authFetcher } from '@/lib/swr-fetcher';
import { plutus } from '@/theme/tokens';

type Summary = {
  monthlySpend: number;
  annualSpend: number;
  systemsCount: number;
  renewalsIn30Days: number;
  renewalsIn60Days: number;
  renewalsIn90Days: number;
  highRiskCount: number;
};

type ContractRow = {
  _id: string;
  renewalDate: string;
  costAmount: number;
  billingCycle: string;
  systemId?: { name?: string };
};

type Insights = {
  systemsWithNoOwner: { id: string; name: string }[];
  duplicateVendors: { vendor: string; count: number }[];
  topSystemsByAnnualCost: { systemName: string; annualCost: number }[];
};

const chartTooltipStyle = {
  borderRadius: 12,
  border: `1px solid ${plutus.color.border}`,
  boxShadow: plutus.shadow.card,
};

export default function DashboardPage() {
  const { data: summary } = useSWR<Summary>('analytics/summary', authFetcher);
  const { data: byCategory } = useSWR<{ category: string; total: number }[]>(
    'analytics/spend-by-category',
    authFetcher,
  );
  const { data: insights } = useSWR<Insights>('analytics/insights', authFetcher);
  const { data: contracts } = useSWR<ContractRow[]>(
    'contracts?upcoming=true',
    authFetcher,
  );

  const upcoming = (contracts ?? [])
    .slice()
    .sort(
      (a, b) =>
        new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime(),
    )
    .slice(0, 5);

  const chartData = (byCategory ?? []).map((c) => ({
    name: c.category,
    total: Math.round(c.total),
  }));

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        description="Spend, renewals, and portfolio insights at a glance."
      />

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiStatCard
            title="Monthly spend (est.)"
            value={`$${(summary?.monthlySpend ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            hint="Normalized to monthly equivalents"
            icon={DollarSign}
            accent="teal"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiStatCard
            title="Annual spend (est.)"
            value={`$${(summary?.annualSpend ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            hint="Across active contracts"
            icon={Layers}
            accent="violet"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiStatCard
            title="Renewals in 30 days"
            value={summary?.renewalsIn30Days != null ? String(summary.renewalsIn30Days) : '—'}
            hint="Contracts requiring attention soon"
            icon={CalendarClock}
            accent="amber"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiStatCard
            title="High-risk items"
            value={summary?.highRiskCount != null ? String(summary.highRiskCount) : '—'}
            hint="Auto-renew with no owner"
            icon={AlertTriangle}
            accent="rose"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={6}>
          <AppCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, letterSpacing: '-0.02em' }}>
                Upcoming renewals
              </Typography>
              {!upcoming.length ? (
                <Box
                  sx={{
                    py: 4,
                    px: 2,
                    textAlign: 'center',
                    color: 'text.secondary',
                  }}
                >
                  <CalendarClock size={36} strokeWidth={1.5} style={{ opacity: 0.45, marginBottom: 8 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', mb: 0.5 }}>
                    No upcoming renewals
                  </Typography>
                  <Typography variant="caption">When contracts approach renewal, they will appear here.</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="medium">
                    <TableHead>
                      <TableRow>
                        <TableCell>System</TableCell>
                        <TableCell>Renewal</TableCell>
                        <TableCell align="right">Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {upcoming.map((c) => (
                        <TableRow key={c._id} hover>
                          <TableCell>
                            <MuiLink
                              component={Link}
                              href={`/dashboard/contracts/${c._id}`}
                              sx={{ fontWeight: 500 }}
                            >
                              {(c.systemId as { name?: string })?.name ?? '—'}
                            </MuiLink>
                          </TableCell>
                          <TableCell>{new Date(c.renewalDate).toLocaleDateString()}</TableCell>
                          <TableCell align="right">${c.costAmount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </AppCard>
        </Grid>

        <Grid item xs={12} lg={6}>
          <AppCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 }, height: '100%' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, letterSpacing: '-0.02em' }}>
                Spend by category
              </Typography>
              <Box sx={{ width: '100%', height: 280 }}>
                {!chartData.length ? (
                  <Box
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      color: 'text.secondary',
                      px: 2,
                      textAlign: 'center',
                    }}
                  >
                    <Layers size={32} strokeWidth={1.5} style={{ opacity: 0.5 }} />
                    <Typography variant="body2">No category data yet</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Import systems and contracts to visualize spend distribution.
                    </Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={plutus.color.border} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: plutus.color.muted, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis tick={{ fill: plutus.color.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: plutus.color.primarySoft }}
                        contentStyle={chartTooltipStyle}
                      />
                      <Bar
                        dataKey="total"
                        name="Annual (est.)"
                        fill={plutus.color.chart1}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </AppCard>
        </Grid>

        <Grid item xs={12}>
          <AppCard>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, letterSpacing: '-0.02em' }}>
                Insights
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Portfolio hygiene and concentration signals
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(15, 23, 42, 0.02)',
                      border: `1px solid ${plutus.color.border}`,
                      height: '100%',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      No business owner
                    </Typography>
                    <Stack spacing={1} sx={{ mt: 1.5 }}>
                      {(insights?.systemsWithNoOwner ?? []).length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                          None — great coverage.
                        </Typography>
                      )}
                      {(insights?.systemsWithNoOwner ?? []).map((s) => (
                        <MuiLink
                          key={s.id}
                          component={Link}
                          href={`/dashboard/systems/${s.id}`}
                          sx={{ fontWeight: 500, fontSize: '0.875rem' }}
                        >
                          {s.name}
                        </MuiLink>
                      ))}
                    </Stack>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(15, 23, 42, 0.02)',
                      border: `1px solid ${plutus.color.border}`,
                      height: '100%',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Duplicate vendors
                    </Typography>
                    <Stack spacing={1} sx={{ mt: 1.5 }}>
                      {(insights?.duplicateVendors ?? []).length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                          None detected.
                        </Typography>
                      )}
                      {(insights?.duplicateVendors ?? []).map((d) => (
                        <Box key={d.vendor} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {d.vendor}
                          </Typography>
                          <Chip label={d.count} size="small" sx={{ height: 22, fontWeight: 600 }} />
                          <MuiLink component={Link} href="/dashboard/systems" variant="body2">
                            View systems
                          </MuiLink>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(15, 23, 42, 0.02)',
                      border: `1px solid ${plutus.color.border}`,
                      height: '100%',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Top systems by annual cost
                    </Typography>
                    <Stack spacing={1} sx={{ mt: 1.5 }}>
                      {(insights?.topSystemsByAnnualCost ?? []).length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                          No cost data yet.
                        </Typography>
                      )}
                      {(insights?.topSystemsByAnnualCost ?? []).map((t) => (
                        <Box
                          key={t.systemName}
                          sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {t.systemName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ${t.annualCost.toLocaleString()}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </AppCard>
        </Grid>
      </Grid>
    </Box>
  );
}
