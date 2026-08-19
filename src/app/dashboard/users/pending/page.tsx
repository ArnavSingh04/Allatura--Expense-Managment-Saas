'use client';

import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import useSWR from 'swr';
import RequireAdmin from '@/components/auth/RequireAdmin';
import AppCard from '@/components/ui/AppCard';
import PageHeader from '@/components/ui/PageHeader';
import { ApiError } from '@/lib/api-client';
import { ROLE_LABEL } from '@/lib/rbac';
import {
  invitationService,
  type Invitation,
  type InvitationStatus,
} from '@/services/invitationService';

const INVITE_ROLES: Array<'admin' | 'finance' | 'general'> = [
  'admin',
  'finance',
  'general',
];

const STATUS_COLOR: Record<
  InvitationStatus,
  'default' | 'warning' | 'success' | 'error'
> = {
  Pending: 'warning',
  Accepted: 'success',
  Expired: 'default',
  Revoked: 'error',
};

export default function InvitationsPage() {
  return (
    <RequireAdmin>
      <InvitationsContent />
    </RequireAdmin>
  );
}

function InvitationsContent() {
  const { data, mutate, isLoading } = useSWR<Invitation[]>('invitations', () =>
    invitationService.list(),
  );
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'finance' | 'general'>('general');
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const rows = Array.isArray(data) ? data : [];

  const errText = (err: unknown, fallback: string) =>
    err instanceof ApiError ? err.message : fallback;

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email.trim()) {
      setError('Enter an email address.');
      return;
    }
    setCreating(true);
    try {
      await invitationService.create(email.trim().toLowerCase(), role);
      setMessage(`Invitation sent to ${email.trim().toLowerCase()}.`);
      setEmail('');
      await mutate();
    } catch (err) {
      setError(errText(err, 'Could not send the invitation.'));
    } finally {
      setCreating(false);
    }
  };

  const resend = async (id: string) => {
    setBusy((b) => ({ ...b, [id]: true }));
    setError('');
    setMessage('');
    try {
      await invitationService.resend(id);
      setMessage('Invitation resent with a fresh link.');
      await mutate();
    } catch (err) {
      setError(errText(err, 'Could not resend the invitation.'));
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  };

  const revoke = async (id: string) => {
    setBusy((b) => ({ ...b, [id]: true }));
    setError('');
    setMessage('');
    try {
      await invitationService.revoke(id);
      setMessage('Invitation revoked.');
      await mutate();
    } catch (err) {
      setError(errText(err, 'Could not revoke the invitation.'));
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  };

  return (
    <Box>
      <PageHeader
        title="User invitations"
        description="Invite people by email and assign a role. Links are single-use and expire automatically."
      />

      <AppCard>
        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
          <Box
            component="form"
            onSubmit={createInvite}
            sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}
          >
            <TextField
              label="Email"
              type="email"
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ minWidth: 260 }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as 'admin' | 'finance' | 'general')
                }
              >
                {INVITE_ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button type="submit" variant="contained" disabled={creating}>
              Send invitation
            </Button>
          </Box>

          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell>Invited by</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  const isBusy = !!busy[row.id];
                  const canResend =
                    row.status === 'Pending' || row.status === 'Expired';
                  const canRevoke = row.status === 'Pending';
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{ROLE_LABEL[row.role] ?? row.role}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={STATUS_COLOR[row.status]}
                          label={row.status}
                        />
                      </TableCell>
                      <TableCell>
                        {row.expiresAt
                          ? new Date(row.expiresAt).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>{row.invitedByName || '-'}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            variant="outlined"
                            size="small"
                            disabled={isBusy || !canResend}
                            onClick={() => void resend(row.id)}
                          >
                            Resend
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            disabled={isBusy || !canRevoke}
                            onClick={() => void revoke(row.id)}
                          >
                            Revoke
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}
                    >
                      No invitations yet. Send one above.
                    </TableCell>
                  </TableRow>
                )}
                {isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </AppCard>
    </Box>
  );
}
