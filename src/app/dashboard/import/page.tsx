'use client';

import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { ApiHelper } from '@/lib/api-helper';
import {
  dashboardHeader,
  dashboardSubheader,
} from '@/styles/MaterialStyles/shared/sharedStyles';

const FIELDS = ['name', 'vendor', 'category', 'department', 'criticality'] as const;

type Step = 0 | 1 | 2 | 3;

export default function ImportPage() {
  const [step, setStep] = useState<Step>(0);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sample, setSample] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: { row: number; message: string }[];
  } | null>(null);

  const onDrop = useCallback(
    async (f: File | null) => {
      if (!f || !f.name.endsWith('.csv')) {
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        return;
      }
      setFile(f);
      const fd = new FormData();
      fd.append('file', f);
      const api = new ApiHelper('import/preview');
      api.includeKey = false;
      const res = (await api.fetchMultipart(fd)) as {
        failed?: boolean;
        headers?: string[];
        sampleRows?: Record<string, string>[];
      };
      if (!res?.failed && res.headers) {
        setHeaders(res.headers);
        setSample(res.sampleRows ?? []);
        const init: Record<string, string> = {};
        for (const field of FIELDS) {
          const match = res.headers.find(
            (h) => h.toLowerCase() === field.toLowerCase(),
          );
          init[field] = match ?? '';
        }
        setMapping(init);
        setStep(1);
      }
    },
    [],
  );

  const runImport = async () => {
    if (!file) {
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('mapping', JSON.stringify(mapping));
    const api = new ApiHelper('import/systems');
    api.includeKey = false;
    const res = (await api.fetchMultipart(fd)) as {
      failed?: boolean;
      imported?: number;
      skipped?: number;
      errors?: { row: number; message: string }[];
    };
    if (!res?.failed) {
      setResult({
        imported: res.imported ?? 0,
        skipped: res.skipped ?? 0,
        errors: res.errors ?? [],
      });
      setStep(3);
    }
  };

  const previewRows = sample.map((row) => {
    const out: Record<string, string> = {};
    for (const f of FIELDS) {
      const col = mapping[f];
      out[f] = col ? row[col] ?? '' : '';
    }
    return out;
  });

  return (
    <Box>
      <Typography sx={dashboardHeader}>Import systems</Typography>
      <Typography sx={dashboardSubheader} gutterBottom>
        CSV wizard (max 5MB)
      </Typography>

      {step === 0 && (
        <Box sx={{ border: '2px dashed #ccc', p: 4, textAlign: 'center' }}>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => void onDrop(e.target.files?.[0] ?? null)}
          />
        </Box>
      )}

      {step === 1 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Map columns
          </Typography>
          {FIELDS.map((field) => (
            <FormControl key={field} fullWidth margin="normal" size="small">
              <InputLabel>{field}</InputLabel>
              <Select
                label={field}
                value={mapping[field] ?? ''}
                onChange={(e) =>
                  setMapping((m) => ({ ...m, [field]: e.target.value }))
                }
              >
                <MenuItem value="">—</MenuItem>
                {headers.map((h) => (
                  <MenuItem key={h} value={h}>
                    {h}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => setStep(2)}>
            Next
          </Button>
        </Box>
      )}

      {step === 2 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Preview (first 5 rows)
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                {FIELDS.map((f) => (
                  <TableCell key={f}>{f}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {previewRows.map((row, i) => (
                <TableRow key={i}>
                  {FIELDS.map((f) => (
                    <TableCell key={f}>{row[f]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => void runImport()}>
            Confirm import
          </Button>
        </Box>
      )}

      {step === 3 && result && (
        <Box>
          <Typography>
            Imported: {result.imported} · Skipped: {result.skipped}
          </Typography>
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Errors
          </Typography>
          <ul>
            {result.errors.map((e) => (
              <li key={e.row}>
                Row {e.row}: {e.message}
              </li>
            ))}
          </ul>
          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => {
              setStep(0);
              setFile(null);
              setResult(null);
            }}
          >
            Start over
          </Button>
        </Box>
      )}
    </Box>
  );
}
