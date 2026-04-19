'use client';

import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
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
  Tooltip,
  Typography,
} from '@mui/material';
import { Copy } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import RequireAdmin from '@/components/auth/RequireAdmin';
import AppCard from '@/components/ui/AppCard';
import PageHeader from '@/components/ui/PageHeader';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { ApiHelper, REQUEST_TYPE } from '@/lib/api-helper';
import { authFetcher } from '@/lib/swr-fetcher';

type UserRole = 'admin' | 'editor' | 'viewer';
type UserStatus = 'PendingApproval' | 'Active' | 'Rejected';

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
};

function statusColor(status: UserStatus): 'success' | 'warning' | 'default' {
  if (status === 'Active') return 'success';
  if (status === 'PendingApproval') return 'warning';
  return 'default';
}

function normalizeRole(value: unknown): UserRole {
  return value === 'admin' || value === 'editor' || value === 'viewer'
    ? value
    : 'viewer';
}

export default function UsersPage() {
  return (
    <RequireAdmin>
      <UsersContent />
    </RequireAdmin>
  );
}

function UsersContent() {
  const { session } = useAuthSession();
  const { data, mutate, isLoading } = useSWR<UserRow[]>('users', authFetcher);
  const [editedRoles, setEditedRoles] = useState<Record<string, UserRole>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const rows = Array.isArray(data) ? data : [];
  const tenantId = session?.tenantId ?? '';

  const updateRole = async (userId: string) => {
    const role = editedRoles[userId];
    if (!role) return;
    setBusy((b) => ({ ...b, [userId]: true }));
    setError('');
    setMessage('');
    const api = new ApiHelper(`users/${userId}/role`);
    api.includeKey = false;
    api.type = REQUEST_TYPE.PATCH;
    api.body = { role };
    const res = (await api.fetchRequest()) as {
      failed?: boolean;
      error?: string;
    };
    setBusy((b) => ({ ...b, [userId]: false }));
    if (res?.failed) {
      setError(res.error || 'Could not update role.');
      return;
    }
    setMessage('Role updated.');
    setEditedRoles((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
    await mutate();
  };

  const setStatus = async (userId: string, status: 'Active' | 'Rejected') => {
    setBusy((b) => ({ ...b, [userId]: true }));
    setError('');
    setMessage('');
    const api = new ApiHelper(`users/${userId}/status`);
    api.includeKey = false;
    api.type = REQUEST_TYPE.PATCH;
    api.body = { status };
    const res = (await api.fetchRequest()) as {
      failed?: boolean;
      error?: string;
    };
    setBusy((b) => ({ ...b, [userId]: false }));
    if (res?.failed) {
      setError(res.error || 'Could not change status.');
      return;
    }
    setMessage(status === 'Active' ? 'Access restored.' : 'Access revoked.');
    await mutate();
  };

  const copyTenantId = async () => {
    try {
      await navigator.clipboard.writeText(tenantId);
      setMessage('Organisation ID copied to clipboard.');
    } catch {
      setError('Could not copy to clipboard.');
    }
  };

  return (
    <Box>
      <PageHeader
        title="User management"
        description="Manage the people in your organisation, their roles, and access status."
      />

      <AppCard sx={{ mb: 2 }}>
        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Invite teammates
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Share this organisation ID. They sign up at{' '}
                <strong>/register</strong> using the “Join existing organisation”
                tab — you'll then approve them on the pending page.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              component={Link}
              href="/dashboard/users/pending"
            >
              Pending requests
            </Button>
          </Stack>
          <Box sx={{ mt: 2, maxWidth: 400 }}>
            <TextField
              fullWidth
              size="small"
              label="Organisation ID"
              value={tenantId}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Copy">
                      <IconButton size="small" onClick={() => void copyTenantId()}>
                        <Copy size={16} />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>
      </AppCard>

      <AppCard>
        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((user) => {
                  const isSelf = session?.sub === user.id;
                  const currentRole = normalizeRole(user.role);
                  const selectedRole = editedRoles[user.id] ?? currentRole;
                  const dirty = selectedRole !== currentRole;
                  const isBusy = !!busy[user.id];
                  return (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        {user.name || '-'} {isSelf && <Chip size="small" label="You" sx={{ ml: 1 }} />}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={user.status}
                          color={statusColor(user.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 130 }}>
                          <Select
                            value={selectedRole}
                            disabled={isSelf || user.status !== 'Active'}
                            onChange={(e) =>
                              setEditedRoles((prev) => ({
                                ...prev,
                                [user.id]: normalizeRole(e.target.value),
                              }))
                            }
                          >
                            <MenuItem value="viewer">Viewer</MenuItem>
                            <MenuItem value="editor">Editor</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          {dirty && user.status === 'Active' && !isSelf && (
                            <Button
                              size="small"
                              variant="contained"
                              disabled={isBusy}
                              onClick={() => void updateRole(user.id)}
                            >
                              Save role
                            </Button>
                          )}
                          {user.status === 'Active' && !isSelf && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              disabled={isBusy}
                              onClick={() => void setStatus(user.id, 'Rejected')}
                            >
                              Revoke
                            </Button>
                          )}
                          {user.status === 'Rejected' && (
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={isBusy}
                              onClick={() => void setStatus(user.id, 'Active')}
                            >
                              Reinstate
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}
                    >
                      No users yet.
                    </TableCell>
                  </TableRow>
                )}
                {isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
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
