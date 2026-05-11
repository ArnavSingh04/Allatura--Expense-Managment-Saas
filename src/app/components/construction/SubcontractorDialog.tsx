'use client';

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/api-client';
import { subcontractorService } from '@/services/subcontractorService';
import type { Subcontractor } from '@/types/construction';

type Props = {
  open: boolean;
  onClose: () => void;
  existing?: Subcontractor;
  onSaved?: () => void;
};

export default function SubcontractorDialog({
  open,
  onClose,
  existing,
  onSaved,
}: Props) {
  const [name, setName] = useState('');
  const [trade, setTrade] = useState('');
  const [abn, setAbn] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiresAt, setLicenseExpiresAt] = useState('');
  const [insuranceExpiresAt, setInsuranceExpiresAt] = useState('');
  const [preferred, setPreferred] = useState(false);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(existing?.name ?? '');
    setTrade(existing?.trade ?? '');
    setAbn(existing?.abn ?? '');
    setEmail(existing?.email ?? '');
    setPhone(existing?.phone ?? '');
    setContactPerson(existing?.contactPerson ?? '');
    setLicenseNumber(existing?.licenseNumber ?? '');
    setLicenseExpiresAt(existing?.licenseExpiresAt?.slice(0, 10) ?? '');
    setInsuranceExpiresAt(existing?.insuranceExpiresAt?.slice(0, 10) ?? '');
    setPreferred(existing?.preferred ?? false);
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
    const payload = {
      name: name.trim(),
      trade: trade.trim() || undefined,
      abn: abn.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      contactPerson: contactPerson.trim() || undefined,
      licenseNumber: licenseNumber.trim() || undefined,
      licenseExpiresAt: licenseExpiresAt || null,
      insuranceExpiresAt: insuranceExpiresAt || null,
      preferred,
      notes: notes.trim() || undefined,
    };
    try {
      if (existing) {
        await subcontractorService.update(existing._id, payload);
      } else {
        await subcontractorService.create(payload);
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 6 }}>
        {existing ? `Edit ${existing.name}` : 'New subcontractor'}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Trade contacts, license & insurance dates are tracked here.
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
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Trade"
              placeholder="Electrical, Plumbing…"
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="ABN"
              value={abn}
              onChange={(e) => setAbn(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Contact person"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="License #"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              type="date"
              label="License expires"
              value={licenseExpiresAt}
              onChange={(e) => setLicenseExpiresAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              fullWidth
              type="date"
              label="Insurance expires"
              value={insuranceExpiresAt}
              onChange={(e) => setInsuranceExpiresAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferred}
                  onChange={(_, v) => setPreferred(v)}
                />
              }
              label="Mark as preferred subcontractor"
            />
          </Grid>
        </Grid>
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
