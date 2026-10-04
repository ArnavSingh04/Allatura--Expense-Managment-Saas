'use client';

import {
  Box,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import StatusChip from '@/components/construction/StatusChip';

export default function DemoCommercialTable() {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
        Payment claims — Jetty remediation
      </Typography>
      <TableContainer>
        <Table size="small" aria-label="Demo payment claims">
          <TableHead>
            <TableRow>
              <TableCell>Period</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Certified</TableCell>
              <TableCell align="right">Progress</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  PC-09 · Mar
                </Typography>
              </TableCell>
              <TableCell>
                <StatusChip status="Certified" />
              </TableCell>
              <TableCell align="right">$612,400</TableCell>
              <TableCell align="right" sx={{ minWidth: 100 }}>
                <LinearProgress variant="determinate" value={88} sx={{ height: 6, borderRadius: 999 }} />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  PC-10 · Apr
                </Typography>
              </TableCell>
              <TableCell>
                <StatusChip status="UnderReview" />
              </TableCell>
              <TableCell align="right">—</TableCell>
              <TableCell align="right">
                <LinearProgress variant="determinate" value={42} sx={{ height: 6, borderRadius: 999 }} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
