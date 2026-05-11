'use client';

import {
  Alert,
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
import {
  dashboardHeader,
  dashboardSubheader,
} from '@/styles/MaterialStyles/shared/sharedStyles';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { ApiError } from '@/lib/api-client';
import {
  subcontractorService,
  type CreateSubcontractorInput,
} from '@/services/subcontractorService';

type CsvImportField = {
  key: string;
  label: string;
  aliases: string[];
};

const FIELDS: CsvImportField[] = [
  { key: 'name', label: 'Name', aliases: ['name', 'company', 'subcontractor'] },
  { key: 'abn', label: 'ABN', aliases: ['abn'] },
  { key: 'trade', label: 'Trade', aliases: ['trade', 'discipline'] },
  { key: 'email', label: 'Email', aliases: ['email'] },
  { key: 'phone', label: 'Phone', aliases: ['phone', 'mobile'] },
  {
    key: 'contactPerson',
    label: 'Contact person',
    aliases: ['contact person', 'contact_person', 'contact'],
  },
  {
    key: 'licenseNumber',
    label: 'License number',
    aliases: ['license number', 'license_number', 'license'],
  },
  {
    key: 'licenseExpiresAt',
    label: 'License expiry',
    aliases: ['license expiry', 'license_expiry', 'license expires'],
  },
  {
    key: 'insuranceExpiresAt',
    label: 'Insurance expiry',
    aliases: ['insurance expiry', 'insurance_expiry', 'insurance expires'],
  },
  { key: 'preferred', label: 'Preferred', aliases: ['preferred'] },
  { key: 'notes', label: 'Notes', aliases: ['notes'] },
];

type Step = 0 | 1 | 2 | 3;

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (!inQ && c === ',') {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur.trim());
  return out.map((s) => s.replace(/^"|"$/g, ''));
}

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.every((c) => !c)) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = cols[j] ?? '';
    });
    rows.push(row);
  }
  return { headers, rows };
}

function normHeader(h: string) {
  return h.toLowerCase().trim();
}

function parsePreferred(v: string): boolean | undefined {
  const s = v.trim().toLowerCase();
  if (!s) return undefined;
  if (['yes', 'y', 'true', '1'].includes(s)) return true;
  if (['no', 'n', 'false', '0'].includes(s)) return false;
  return undefined;
}

function parseOptionalDate(v: string): string | null | undefined {
  const s = v.trim();
  if (!s) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export default function ImportPage() {
  const { can } = useAuthSession();
  const allowed = can('subbies.edit');

  const [step, setStep] = useState<Step>(0);
  const [allRows, setAllRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sample, setSample] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: { row: number; message: string }[];
  } | null>(null);

  const onPickFile = useCallback(async (f: File | null) => {
    setPageError(null);
    if (!f || !f.name.toLowerCase().endsWith('.csv')) {
      setPageError('Please choose a CSV file.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setPageError('File must be 5MB or smaller.');
      return;
    }
    const text = await f.text();
    const { headers: h, rows } = parseCsv(text);
    if (!h.length || !rows.length) {
      setPageError('CSV must include a header row and at least one data row.');
      return;
    }
    setHeaders(h);
    setAllRows(rows);
    setSample(rows.slice(0, 5));
    const init: Record<string, string> = {};
    for (const field of FIELDS) {
      const match = h.find((header) =>
        field.aliases.includes(normHeader(header)),
      );
      init[field.key] = match ?? '';
    }
    setMapping(init);
    setStep(1);
  }, []);

  const runImport = async () => {
    if (!allowed || !allRows.length) return;
    setBusy(true);
    setPageError(null);
    const errors: { row: number; message: string }[] = [];
    let imported = 0;
    let skipped = 0;
    let rowNum = 2;
    for (const row of allRows) {
      const nameCol = mapping.name;
      const name = nameCol ? (row[nameCol] ?? '').trim() : '';
      if (!name) {
        skipped += 1;
        rowNum += 1;
        continue;
      }
      const body: CreateSubcontractorInput = { name };
      for (const key of FIELDS.map((f) => f.key)) {
        if (key === 'name') continue;
        const col = mapping[key];
        if (!col) continue;
        const raw = (row[col] ?? '').trim();
        if (!raw) continue;
        if (key === 'preferred') {
          const p = parsePreferred(raw);
          if (p !== undefined) body.preferred = p;
        } else if (key === 'licenseExpiresAt' || key === 'insuranceExpiresAt') {
          const iso = parseOptionalDate(raw);
          if (iso !== undefined) body[key] = iso;
        } else {
          (body as unknown as Record<string, string>)[key] = raw;
        }
      }
      try {
        await subcontractorService.create(body);
        imported += 1;
      } catch (e) {
        errors.push({
          row: rowNum,
          message: e instanceof ApiError ? e.message : String(e),
        });
      }
      rowNum += 1;
    }
    setResult({ imported, skipped, errors });
    setStep(3);
    setBusy(false);
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
      <Typography sx={dashboardHeader}>Import subcontractors</Typography>
      <Typography sx={dashboardSubheader} gutterBottom>
        CSV wizard (max 5MB). Download the template, replace the sample row with
        your subcontractors, then upload and confirm column mapping.
      </Typography>

      {!allowed && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Your role cannot create subcontractors. Ask a project manager or owner
          to run imports, or use an account with subcontractor edit access.
        </Alert>
      )}

      {pageError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {pageError}
        </Alert>
      )}

      {step === 0 && (
        <Box>
          <Box sx={{ mb: 2 }}>
            <Button
              component="a"
              href="/plutus-subcontractors-import-template.csv"
              download="plutus-subcontractors-import-template.csv"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
            >
              Download import template
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Required column: Name. Optional: ABN, Trade, Email, Phone, Contact person, License
              number, License expiry, Insurance expiry, Preferred (Yes/No), Notes. Dates accept ISO
              (YYYY-MM-DD) strings.
            </Typography>
          </Box>
          <Box sx={{ border: '2px dashed', borderColor: 'divider', p: 4, textAlign: 'center' }}>
            <input
              type="file"
              accept=".csv"
              disabled={!allowed}
              onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
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
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            disabled={!allowed || busy}
            onClick={() => void runImport()}
          >
            {busy ? 'Importing…' : 'Confirm import'}
          </Button>
        </Box>
      )}

      {step === 3 && result && (
        <Box>
          <Typography>
            Created: {result.imported} · Skipped empty rows: {result.skipped}
          </Typography>
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Row errors
          </Typography>
          {result.errors.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              None
            </Typography>
          ) : (
            <Box component="ul" sx={{ pl: 2 }}>
              {result.errors.map((e) => (
                <Typography component="li" key={e.row} variant="body2">
                  Row {e.row}: {e.message}
                </Typography>
              ))}
            </Box>
          )}
          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => {
              setStep(0);
              setAllRows([]);
              setResult(null);
              setPageError(null);
            }}
          >
            Start over
          </Button>
        </Box>
      )}
    </Box>
  );
}
