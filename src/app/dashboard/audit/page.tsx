'use client';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState } from 'react';
import useSWR from 'swr';
import { authFetcher } from '@/lib/swr-fetcher';
import {
  dashboardHeader,
  dashboardSubheader,
} from '@/styles/MaterialStyles/shared/sharedStyles';

type AuditItem = {
  _id: string;
  timestamp: string;
  entityType: string;
  entityId: string;
  action: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  performedBy?: { email?: string; name?: string };
};

type AuditResponse = {
  items: AuditItem[];
  total: number;
  page: number;
  limit: number;
};

function Row({ row }: { row: AuditItem }) {
  const [open, setOpen] = useState(false);
  const actor =
    row.performedBy?.name || row.performedBy?.email || '-';
  const summary = `${row.action} · ${row.entityType}`;

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{new Date(row.timestamp).toLocaleString()}</TableCell>
        <TableCell>{actor}</TableCell>
        <TableCell>{row.entityType}</TableCell>
        <TableCell>{row.entityId}</TableCell>
        <TableCell>{row.action}</TableCell>
        <TableCell>{summary}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7} sx={{ py: 0, border: 0 }}>
          <Collapse in={open}>
            <Box
              sx={(theme) => ({
                p: 2,
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.common.white, 0.06)
                    : theme.palette.grey[50],
                color: 'text.primary',
                borderTop: 1,
                borderColor: 'divider',
              })}
            >
              <Typography variant="subtitle2" color="text.secondary">
                Before
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  mt: 0.5,
                  mb: 1.5,
                  fontSize: 12,
                  overflow: 'auto',
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                {JSON.stringify(row.before, null, 2)}
              </Box>
              <Typography variant="subtitle2" color="text.secondary">
                After
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  mt: 0.5,
                  fontSize: 12,
                  overflow: 'auto',
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                {JSON.stringify(row.after, null, 2)}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const { data } = useSWR<AuditResponse>(
    `audit?page=${page}&limit=20`,
    authFetcher,
  );

  return (
    <Box>
      <Typography sx={dashboardHeader}>Audit log</Typography>
      <Typography sx={dashboardSubheader} gutterBottom>
        Immutable history of changes
      </Typography>
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Timestamp</TableCell>
              <TableCell>Actor</TableCell>
              <TableCell>Entity type</TableCell>
              <TableCell>Entity id</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Summary</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.items ?? []).map((row) => (
              <Row key={String(row._id)} row={row} />
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="body2">
          Page {data?.page ?? page} · {data?.total ?? 0} total
        </Typography>
        <IconButton
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          size="small"
        >
          Prev
        </IconButton>
        <IconButton
          disabled={data && page * data.limit >= data.total}
          onClick={() => setPage((p) => p + 1)}
          size="small"
        >
          Next
        </IconButton>
      </Box>
    </Box>
  );
}
