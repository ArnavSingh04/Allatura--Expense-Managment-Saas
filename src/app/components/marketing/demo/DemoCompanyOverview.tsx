'use client';

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { ClipboardList, GanttChartSquare, Wallet, CheckCircle2 } from 'lucide-react';
import KpiStatCard from '@/components/ui/KpiStatCard';
import StatusChip from '@/components/construction/StatusChip';
import BudgetBar from '@/components/construction/BudgetBar';

export default function DemoCompanyOverview() {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
        Company overview
      </Typography>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiStatCard
            title="Active jobs"
            value="14"
            hint="22 total · 6 done"
            icon={GanttChartSquare}
            accent="teal"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiStatCard
            title="Total budget"
            value="$48.2M"
            hint="Paid $31.4M"
            icon={Wallet}
            accent="violet"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiStatCard title="Pending variations" value="7" hint="Need a decision" icon={ClipboardList} accent="amber" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiStatCard
            title="Open payment claims"
            value="5"
            hint="Awaiting certification"
            icon={CheckCircle2}
            accent="rose"
          />
        </Grid>
      </Grid>
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}>
          Riverside tower — budget vs committed
        </Typography>
        <BudgetBar
          budget={{ amount: 1_200_000_000, currency: 'AUD' }}
          committed={{ amount: 840_000_000, currency: 'AUD' }}
          paid={{ amount: 620_000_000, currency: 'AUD' }}
          size="sm"
        />
      </Box>
      <TableContainer>
        <Table size="small" aria-label="Demo projects at risk">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Exposure</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Northline depot
                </Typography>
              </TableCell>
              <TableCell>
                <StatusChip status="AtRisk" />
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" color="warning.main" sx={{ fontWeight: 700 }}>
                  $420K
                </Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Jetty remediation
                </Typography>
              </TableCell>
              <TableCell>
                <StatusChip status="Active" />
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" color="text.secondary">
                  On track
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
