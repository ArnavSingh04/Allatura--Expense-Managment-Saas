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

const FIELDS = [
  { key: 'name', label: 'System', aliases: ['system', 'name'] },
  { key: 'vendor', label: 'Vendor', aliases: ['vendor'] },
  { key: 'category', label: 'Category', aliases: ['category'] },
  { key: 'department', label: 'Department', aliases: ['department'] },
  {
    key: 'businessOwner',
    label: 'Business owner',
    aliases: ['business owner', 'business_owner', 'owner'],
  },
  { key: 'criticality', label: 'Criticality', aliases: ['criticality'] },
  {
    key: 'annualCost',
    label: 'Annual cost (est.)',
    aliases: ['annual cost (est.)', 'annual cost', 'annual_cost', 'annualcost'],
  },
  {
    key: 'nextRenewal',
    label: 'Next renewal',
    aliases: ['next renewal', 'next_renewal', 'renewal date', 'renewal'],
  },
] as const;

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
          const match = res.headers.find((h) =>
            field.aliases.includes(h.toLowerCase().trim()),
          );
          init[field.key] = match ?? '';
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
      const col = mapping[f.key];
      out[f.key] = col ? row[col] ?? '' : '';
    }
    return out;
  });

  return (
    <Box>
      <Typography sx={dashboardHeader}>Import systems</Typography>
      <Typography sx={dashboardSubheader} gutterBottom>
        CSV wizard (max 5MB). Download the sample template, replace the rows with your systems, then upload
        your file. Column names should match the template so mapping auto-fills.
      </Typography>

      {step === 0 && (
        <Box>
          <Box sx={{ mb: 2 }}>
            <Button
              component="a"
              href="/plutus-systems-import-template.csv"
              download="plutus-systems-import-template.csv"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
            >
              Download import template
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Template columns: System, Vendor, Category, Department, Business owner, Criticality, Annual cost
              (est.), Next renewal. Required by backend: System, Category, Criticality. Category must be SaaS,
              Infrastructure, or Internal Tool. Criticality must be Low, Medium, or High.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              How to use: 1) Download template, 2) Keep headers as-is and replace sample rows, 3) Upload CSV,
              4) Confirm column mapping, 5) Review preview, 6) Confirm import to populate systems.
            </Typography>
          </Box>
          <Box sx={{ border: '2px dashed #ccc', p: 4, textAlign: 'center' }}>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => void onDrop(e.target.files?.[0] ?? null)}
            />
          </Box>
        </Box>
      )}

      {step === 1 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Map columns
          </Typography>
          {FIELDS.map((field) => (
            <FormControl key={field.key} fullWidth margin="normal" size="small">
              <InputLabel>{field.label}</InputLabel>
              <Select
                label={field.label}
                value={mapping[field.key] ?? ''}
                onChange={(e) =>
                  setMapping((m) => ({ ...m, [field.key]: e.target.value }))
                }
              >
                <MenuItem value="">-</MenuItem>
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
                  <TableCell key={f.key}>{f.label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {previewRows.map((row, i) => (
                <TableRow key={i}>
                  {FIELDS.map((f) => (
                    <TableCell key={f.key}>{row[f.key]}</TableCell>
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
