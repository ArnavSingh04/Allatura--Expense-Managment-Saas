'use client';

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/api-client';
import { supplierService } from '@/services/supplierService';
import type { Supplier } from '@/types/construction';

type Props = {
  open: boolean;
  onClose: () => void;
  existing?: Supplier;
  onSaved?: () => void;
};

export default function SupplierDialog({
  open,
  onClose,
  existing,
  onSaved,
}: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(existing?.name ?? '');
    setCategory(existing?.category ?? '');
    setEmail(existing?.email ?? '');
    setPhone(existing?.phone ?? '');
    setAccountNumber(existing?.accountNumber ?? '');
    setNotes(existing?.notes ?? '');
    setError(null);
  }, [open, existing]);

  const save = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        category: category.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      if (existing) {
        await supplierService.update(existing._id, payload);
      } else {
        await supplierService.create(payload);
      }
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pr: 6 }}>
        {existing ? `Edit ${existing.name}` : 'New supplier'}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Materials, fixtures, equipment hire — anyone you buy from.
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
          <TextField
            fullWidth
            required
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            fullWidth
            label="Category"
            placeholder="Timber, Steel, Plumbing…"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Stack direction="row" spacing={1.5}>
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              fullWidth
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Stack>
          <TextField
            fullWidth
            label="Account #"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : existing ? 'Save changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
