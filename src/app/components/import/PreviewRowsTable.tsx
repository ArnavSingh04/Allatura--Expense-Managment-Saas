'use client';

import { useState } from 'react';
import {
  Box,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ImportRowStatusChip from '@/components/import/ImportRowStatusChip';
import type {
  DuplicatePolicy,
  ImportPreviewRow,
  ImportRowStatus,
} from '@/types/imports';

const ROW_ACTIONS: DuplicatePolicy[] = ['skip', 'update', 'create'];
const ACTION_LABEL: Record<DuplicatePolicy, string> = {
  skip: 'Skip',
  update: 'Update',
  create: 'Create',
};

type Filter = 'all' | ImportRowStatus;

type PreviewRowsTableProps = {
  rows: ImportPreviewRow[];
  busy?: boolean;
  onRowAction: (row: number, action: DuplicatePolicy) => void;
};

/**
 * Preview rows with a per-row action for duplicates.
 *
 * Paginated client-side — the row count is already bounded by the backend's
 * per-file cap, so there is nothing to virtualise.
 */
export default function PreviewRowsTable({
  rows,
  busy = false,
  onRowAction,
}: PreviewRowsTableProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(25);

  const filtered =
    filter === 'all' ? rows : rows.filter((r) => r.status === filter);
  const visible = filtered.slice(page * perPage, page * perPage + perPage);

  const counts = {
    all: rows.length,
    valid: rows.filter((r) => r.status === 'valid').length,
    duplicate: rows.filter((r) => r.status === 'duplicate').length,
    invalid: rows.filter((r) => r.status === 'invalid').length,
  };

  return (
    <Stack spacing={1.5}>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={filter}
        onChange={(_, value: Filter | null) => {
          if (value) {
            setFilter(value);
            setPage(0);
          }
        }}
      >
        <ToggleButton value="all">All ({counts.all})</ToggleButton>
        <ToggleButton value="valid">Valid ({counts.valid})</ToggleButton>
        <ToggleButton value="duplicate">
          Duplicates ({counts.duplicate})
        </ToggleButton>
        <ToggleButton value="invalid">Invalid ({counts.invalid})</ToggleButton>
      </ToggleButtonGroup>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 70 }}>Row</TableCell>
              <TableCell>Record</TableCell>
              <TableCell sx={{ width: 110 }}>Status</TableCell>
              <TableCell>Issues</TableCell>
              <TableCell sx={{ width: 140 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((row) => (
              <TableRow key={row.row} hover>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {row.row}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{row.label || '—'}</Typography>
                </TableCell>
                <TableCell>
                  <ImportRowStatusChip status={row.status} />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {row.issues.length ? row.issues.join('; ') : '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {row.status === 'duplicate' ? (
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={row.action}
                      disabled={busy}
                      onChange={(e) =>
                        onRowAction(row.row, e.target.value as DuplicatePolicy)
                      }
                    >
                      {ROW_ACTIONS.map((action) => (
                        <MenuItem key={action} value={action}>
                          {ACTION_LABEL[action]}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      —
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Box sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No rows match this filter.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {filtered.length > 10 && (
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, next) => setPage(next)}
          rowsPerPage={perPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onRowsPerPageChange={(e) => {
            setPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      )}
    </Stack>
  );
}
