'use client';

import {
  Box,
  Card,
  CardContent,
  Link as MuiLink,
  Table,
  TableBody,
  TableCell,
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
import { authFetcher } from '@/lib/swr-fetcher';
import {
  dashboardHeader,
  dashboardSubheader,
} from '@/styles/MaterialStyles/shared/sharedStyles';

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
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography sx={dashboardHeader}>Dashboard</Typography>
        <Typography sx={dashboardSubheader}>
          Spend, renewals, and portfolio insights
        </Typography>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary">Monthly spend (est.)</Typography>
            <Typography variant="h5">
              ${(summary?.monthlySpend ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary">Annual spend (est.)</Typography>
            <Typography variant="h5">
              ${(summary?.annualSpend ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary">Renewals in 30 days</Typography>
            <Typography variant="h5">{summary?.renewalsIn30Days ?? '—'}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary">High-risk (auto-renew, no owner)</Typography>
            <Typography variant="h5">{summary?.highRiskCount ?? '—'}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card variant="outlined" sx={{ height: 320 }}>
          <CardContent sx={{ height: '100%' }}>
            <Typography sx={dashboardHeader}>Upcoming renewals</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>System</TableCell>
                  <TableCell>Renewal</TableCell>
                  <TableCell align="right">Cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {upcoming.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell>
                      <MuiLink component={Link} href={`/dashboard/contracts/${c._id}`}>
                        {(c.systemId as { name?: string })?.name ?? '—'}
                      </MuiLink>
                    </TableCell>
                    <TableCell>
                      {new Date(c.renewalDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">{c.costAmount}</TableCell>
                  </TableRow>
                ))}
                {!upcoming.length && (
                  <TableRow>
                    <TableCell colSpan={3}>No upcoming renewals</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card variant="outlined" sx={{ height: 320 }}>
          <CardContent sx={{ height: '100%' }}>
            <Typography sx={dashboardHeader}>Spend by category</Typography>
            <Box sx={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#2dcf89" name="Annual (est.)" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography sx={dashboardHeader}>Insights</Typography>
            <Typography sx={dashboardSubheader} gutterBottom>
              Systems without a business owner
            </Typography>
            <ul>
              {(insights?.systemsWithNoOwner ?? []).map((s) => (
                <li key={s.id}>
                  <MuiLink component={Link} href={`/dashboard/systems/${s.id}`}>
                    {s.name}
                  </MuiLink>
                </li>
              ))}
              {!insights?.systemsWithNoOwner?.length && <li>None</li>}
            </ul>
            <Typography sx={dashboardSubheader} gutterBottom>
              Duplicate vendors
            </Typography>
            <ul>
              {(insights?.duplicateVendors ?? []).map((d) => (
                <li key={d.vendor}>
                  {d.vendor} ({d.count}) —{' '}
                  <MuiLink component={Link} href="/dashboard/systems">
                    View systems
                  </MuiLink>
                </li>
              ))}
              {!insights?.duplicateVendors?.length && <li>None</li>}
            </ul>
            <Typography sx={dashboardSubheader} gutterBottom>
              Top systems by annual cost
            </Typography>
            <ul>
              {(insights?.topSystemsByAnnualCost ?? []).map((t) => (
                <li key={t.systemName}>
                  {t.systemName}: ${t.annualCost.toLocaleString()}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
