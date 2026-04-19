'use client';

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/api-client';
import { toMinor } from '@/lib/money';
import {
  expenseService,
  type CreateExpenseInput,
} from '@/services/expenseService';
import {
  EXPENSE_KINDS,
  EXPENSE_STATUSES,
  type Contract,
  type Expense,
  type ExpenseKind,
  type ExpenseStatus,
  type Project,
  type Subcontractor,
  type Supplier,
} from '@/types/construction';

type Props = {
  open: boolean;
  onClose: () => void;
  project: Project;
  contracts: Contract[];
  subbies: Subcontractor[];
  suppliers: Supplier[];
  defaultDeptId?: string;
  onCreated?: (e: Expense) => void;
};

const today = () => new Date().toISOString().slice(0, 10);

export default function ExpenseDialog({
  open,
  onClose,
  project,
  contracts,
  subbies,
  suppliers,
  defaultDeptId,
  onCreated,
}: Props) {
  const currency = project.budget.currency;

  const [departmentId, setDepartmentId] = useState(defaultDeptId ?? '');
  const [kind, setKind] = useState<ExpenseKind>('Material');
  const [status, setStatus] = useState<ExpenseStatus>('Committed');
  const [contractId, setContractId] = useState<string>('');
  const [subcontractorId, setSubcontractorId] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [incurredOn, setIncurredOn] = useState(today());
  const [dueOn, setDueOn] = useState('');
  const [amountMajor, setAmountMajor] = useState('');
  const [taxMajor, setTaxMajor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDepartmentId(defaultDeptId ?? project.departments[0]?._id ?? '');
    setKind('Material');
    setStatus('Committed');
    setContractId('');
    setSubcontractorId('');
    setSupplierId('');
    setDescription('');
    setInvoiceNumber('');
    setIncurredOn(today());
    setDueOn('');
    setAmountMajor('');
    setTaxMajor('');
    setError(null);
  }, [open, defaultDeptId, project]);

  const save = async () => {
    setError(null);
    if (!departmentId || !description.trim() || !amountMajor) {
      setError('Department, description and amount are required.');
      return;
    }
    setBusy(true);
    try {
      const input: CreateExpenseInput = {
        departmentId,
        kind,
        status,
        contractId: contractId || null,
        subcontractorId: subcontractorId || null,
        supplierId: supplierId || null,
        description: description.trim(),
        invoiceNumber: invoiceNumber.trim() || undefined,
        incurredOn,
        dueOn: dueOn || null,
        amount: { amount: toMinor(amountMajor), currency },
        tax: taxMajor
          ? { amount: toMinor(taxMajor), currency }
          : { amount: 0, currency },
      };
      const created = await expenseService.create(project._id, input);
      onCreated?.(created);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save expense.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 6 }}>
        New expense
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Material, labor, equipment or subcontract spend against this job.
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
          size="small"
        >
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5}>
            <TextField
              fullWidth
              required
              select
              label="Department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              {project.departments.map((d) => (
                <MenuItem key={d._id} value={d._id}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as ExpenseKind)}
            >
              {EXPENSE_KINDS.map((k) => (
                <MenuItem key={k} value={k}>
                  {k}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ExpenseStatus)}
            >
              {EXPENSE_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <TextField
            fullWidth
            required
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Stack direction="row" spacing={1.5}>
            <TextField
              fullWidth
              required
              label={`Amount (${currency})`}
              type="number"
              value={amountMajor}
              onChange={(e) => setAmountMajor(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label={`Tax (${currency})`}
              type="number"
              value={taxMajor}
              onChange={(e) => setTaxMajor(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <TextField
              fullWidth
              label="Invoice #"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
            <TextField
              fullWidth
              label="Incurred"
              type="date"
              value={incurredOn}
              onChange={(e) => setIncurredOn(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Due"
              type="date"
              value={dueOn}
              onChange={(e) => setDueOn(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <TextField
              fullWidth
              select
              label="Contract"
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
            >
              <MenuItem value="">— None —</MenuItem>
              {contracts.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.reference}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Subcontractor"
              value={subcontractorId}
              onChange={(e) => setSubcontractorId(e.target.value)}
            >
              <MenuItem value="">— None —</MenuItem>
              {subbies.map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <MenuItem value="">— None —</MenuItem>
              {suppliers.map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save expense'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
