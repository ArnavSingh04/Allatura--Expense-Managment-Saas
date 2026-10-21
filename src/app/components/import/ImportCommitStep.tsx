'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
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
import { CheckCircle2, Download, RefreshCw } from 'lucide-react';
import AppCard from '@/components/ui/AppCard';
import { importErrorMessage } from '@/lib/import-errors';
import { importService } from '@/services/importService';
import {
  allErrorRows,
  resultTotals,
  type MemberView,
} from '@/components/import/importFlow';
import type { ImportSession } from '@/types/imports';

/** Where to send the user to see what they just imported. */
const DESTINATION: Record<string, { label: string; href: string }> = {
  projects: { label: 'Projects', href: '/dashboard/projects' },
  suppliers: { label: 'Suppliers', href: '/dashboard/suppliers' },
  subcontractors: {
    label: 'Subcontractors',
    href: '/dashboard/subcontractors',
  },
  contracts: { label: 'Projects', href: '/dashboard/projects' },
  variations: { label: 'Variations', href: '/dashboard/variations' },
};

type ImportCommitStepProps = {
  session: ImportSession;
  views: MemberView[];
  onError: (message: string) => void;
  onRefresh: () => void;
  onStartOver: () => void;
};

export default function ImportCommitStep({
  session,
  views,
  onError,
  onRefresh,
  onStartOver,
}: ImportCommitStepProps) {
  const [downloading, setDownloading] = useState(false);

  const totals = resultTotals(session);
  const errors = allErrorRows(session);
  const { processed, total } = session.progress;
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;

  if (session.status === 'importing') {
    return (
      <Stack spacing={2} sx={{ py: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Importing…
        </Typography>
        <LinearProgress
          variant={total > 0 ? 'determinate' : 'indeterminate'}
          value={percent}
          sx={{ height: 8, borderRadius: 4 }}
        />
        <Typography variant="body2" color="text.secondary">
          {total > 0
            ? `${processed.toLocaleString()} of ${total.toLocaleString()} rows`
            : 'Starting…'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Large imports run in the background. Leave this tab open to watch
          progress, or come back to it later.
        </Typography>
        <Box>
          <Button
            size="small"
            startIcon={<RefreshCw size={15} />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
        </Box>
      </Stack>
    );
  }

  if (session.status === 'failed' && totals.imported === 0) {
    return (
      <Stack spacing={2} sx={{ py: 2 }}>
        <Alert severity="error">
          This import failed before it could finish. Nothing further was
          written.
        </Alert>
        {errors.length > 0 && <ErrorTable errors={errors} />}
        <Box>
          <Button variant="contained" onClick={onStartOver}>
            Start over
          </Button>
        </Box>
      </Stack>
    );
  }

  const destinations = Array.from(
    new Map(
      views
        .map((v) => DESTINATION[v.entityType])
        .filter((d): d is { label: string; href: string } => Boolean(d))
        .map((d) => [d.href, d]),
    ).values(),
  );

  return (
    <Stack spacing={3} sx={{ py: 1 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <CheckCircle2 size={22} color="currentColor" />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {session.status === 'failed'
            ? 'Import finished with errors'
            : 'Import complete'}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
        <Figure label="Created" value={totals.imported} color="success.main" />
        <Figure label="Updated" value={totals.updated} />
        <Figure label="Skipped" value={totals.skipped} />
        <Figure
          label="Failed"
          value={totals.failed}
          color={totals.failed > 0 ? 'error.main' : undefined}
        />
      </Stack>

      {errors.length > 0 && (
        <Stack spacing={1.5}>
          <Divider />
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="subtitle2">
              {errors.length} {errors.length === 1 ? 'row' : 'rows'} could not
              be imported
            </Typography>
            <Button
              size="small"
              startIcon={
                downloading ? (
                  <CircularProgress size={14} />
                ) : (
                  <Download size={15} />
                )
              }
              disabled={downloading}
              onClick={async () => {
                setDownloading(true);
                try {
                  await importService.downloadErrors(session.id);
                } catch (e) {
                  onError(importErrorMessage(e));
                } finally {
                  setDownloading(false);
                }
              }}
            >
              Download failed rows
            </Button>
          </Stack>
          <ErrorTable errors={errors.slice(0, 50)} />
          {errors.length > 50 && (
            <Typography variant="caption" color="text.secondary">
              Showing the first 50. Download the CSV for the full list.
            </Typography>
          )}
        </Stack>
      )}

      {destinations.length > 0 && (
        <Stack spacing={1}>
          <Divider />
          <Typography variant="subtitle2">View imported data</Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {destinations.map((d) => (
              <Button
                key={d.href}
                size="small"
                variant="outlined"
                component={Link}
                href={d.href}
              >
                {d.label}
              </Button>
            ))}
            <Button
              size="small"
              variant="outlined"
              component={Link}
              href="/dashboard/calendar"
            >
              Calendar
            </Button>
          </Stack>
        </Stack>
      )}

      <Box>
        <Button variant="contained" onClick={onStartOver}>
          Import another file
        </Button>
      </Box>
    </Stack>
  );
}

function Figure({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <AppCard sx={{ flex: '1 1 120px', minWidth: 110 }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, color: color ?? 'text.primary' }}
        >
          {value.toLocaleString()}
        </Typography>
      </Box>
    </AppCard>
  );
}

function ErrorTable({
  errors,
}: {
  errors: { entityType?: string; row: number; label: string; message: string }[];
}) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 70 }}>Row</TableCell>
            <TableCell>Record</TableCell>
            <TableCell>Reason</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {errors.map((e, i) => (
            <TableRow key={`${e.entityType ?? ''}-${e.row}-${i}`}>
              <TableCell>
                <Typography variant="caption" color="text.secondary">
                  {e.row}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{e.label || '—'}</Typography>
                {e.entityType && (
                  <Typography variant="caption" color="text.secondary">
                    {e.entityType}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Typography variant="caption" color="error.main">
                  {e.message}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
