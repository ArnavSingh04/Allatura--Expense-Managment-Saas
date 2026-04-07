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
            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2">Before</Typography>
              <pre style={{ fontSize: 12, overflow: 'auto' }}>
                {JSON.stringify(row.before, null, 2)}
              </pre>
              <Typography variant="subtitle2">After</Typography>
              <pre style={{ fontSize: 12, overflow: 'auto' }}>
                {JSON.stringify(row.after, null, 2)}
              </pre>
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
