'use client';

import {
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
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import AppCard from '@/components/ui/AppCard';
import PageHeader from '@/components/ui/PageHeader';
import { ApiHelper, REQUEST_TYPE, getStoredToken } from '@/lib/api-helper';
import { getJwtClaims } from '@/lib/jwt';
import { authFetcher } from '@/lib/swr-fetcher';

type UserRole = 'admin' | 'editor' | 'viewer';

type UserRow = {
  id?: string;
  _id?: string;
  email?: string;
  name?: string;
  role?: UserRole;
};

function normalizeRole(role: unknown): UserRole {
  if (role === 'admin' || role === 'editor' || role === 'viewer') {
    return role;
  }
  return 'viewer';
}

/** GET /users may return a bare array or a wrapper object depending on the API. */
function normalizeUsersList(data: unknown): UserRow[] {
  if (Array.isArray(data)) {
    return data as UserRow[];
  }
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    for (const key of ['users', 'data', 'items', 'results'] as const) {
      const arr = o[key];
      if (Array.isArray(arr)) {
        return arr as UserRow[];
      }
    }
  }
  return [];
}

async function fetchUsersList(): Promise<UserRow[]> {
  return normalizeUsersList(await authFetcher<unknown>('users'));
}

export default function UsersPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const { data: users, mutate } = useSWR<UserRow[]>('users', () => fetchUsersList());
  const [editedRoles, setEditedRoles] = useState<Record<string, UserRole>>({});
  const [savingById, setSavingById] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('viewer');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const claims = getJwtClaims(getStoredToken());
    setIsAdmin(claims?.role === 'admin');
  }, []);

  const rows = users ?? [];

  const updateRole = async (userId: string) => {
    const role = editedRoles[userId];
    if (!role) {
      return;
    }
    setSavingById((s) => ({ ...s, [userId]: true }));
    setError('');
    setMessage('');

    const api = new ApiHelper(`users/${userId}`);
    api.urlParams = 'role';
    api.includeKey = false;
    api.type = REQUEST_TYPE.PATCH;
    api.body = { role };
    const res = (await api.fetchRequest()) as { failed?: boolean; error?: string };

    setSavingById((s) => ({ ...s, [userId]: false }));
    if (res?.failed) {
      setError(res.error || 'Failed to update role');
      return;
    }

    setMessage('Role updated successfully.');
    setEditedRoles((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
    await mutate(async () => fetchUsersList(), { revalidate: false });
  };

  const createUser = async () => {
    if (!newName.trim() || !newEmail.trim() || newPassword.length < 8) {
      setError('Name, valid email, and password (min 8 chars) are required.');
      setMessage('');
      return;
    }
    setCreating(true);
    setError('');
    setMessage('');

    const api = new ApiHelper('users');
    api.includeKey = false;
    api.type = REQUEST_TYPE.POST;
    api.body = {
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      password: newPassword,
      role: newRole,
    };

    const res = (await api.fetchRequest()) as {
      failed?: boolean;
      error?: string;
    };
    setCreating(false);
    if (res?.failed) {
      setError(res.error || 'Failed to create user');
      return;
    }

    // Never call setAuthToken here — admin session must stay unchanged. Backend should not return a session for the new user.

    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('viewer');
    setMessage(
      'User created. They are saved for your organization and can sign in from the login page.',
    );
    await mutate(async () => fetchUsersList(), { revalidate: false });
  };

  if (isAdmin === null) {
    return (
      <Box>
        <PageHeader
          title="User management"
          description="Loading access permissions..."
        />
        <AppCard>
          <Box sx={{ p: 3 }}>
            <Typography variant="body1">Checking your access...</Typography>
          </Box>
        </AppCard>
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box>
        <PageHeader
          title="User management"
          description="Only tenant administrators can manage user roles."
        />
        <AppCard>
          <Box sx={{ p: 3 }}>
            <Typography variant="body1">Access restricted to admins.</Typography>
          </Box>
        </AppCard>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="User management"
        description="Create tenant users and assign admin, editor, or viewer roles."
      />
      <AppCard sx={{ mb: 2 }}>
        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Create user
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            New users are created within your current tenant.
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'flex-start' }}>
            <TextField
              label="Name"
              size="small"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              sx={{ minWidth: 180, flex: 1 }}
            />
            <TextField
              label="Email"
              size="small"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              sx={{ minWidth: 220, flex: 1.2 }}
            />
            <TextField
              label="Password"
              size="small"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Minimum 8 characters"
              sx={{ minWidth: 200, flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={newRole}
                onChange={(e) => setNewRole(normalizeRole(e.target.value))}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="viewer">Viewer</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={() => void createUser()}
              disabled={creating}
              sx={{ minWidth: 120, mt: { xs: 0, md: 0.5 } }}
            >
              {creating ? 'Creating...' : 'Create user'}
            </Button>
          </Stack>
        </Box>
      </AppCard>
      <AppCard>
        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
          {message && (
            <Chip color="success" label={message} sx={{ mb: 2 }} />
          )}
          {error && (
            <Chip color="error" label={error} sx={{ mb: 2 }} />
          )}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Current role</TableCell>
                  <TableCell>New role</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((user) => {
                  const userId = String(user.id ?? user._id ?? '');
                  if (!userId) {
                    return null;
                  }
                  const currentRole = normalizeRole(user.role);
                  const selectedRole = editedRoles[userId] ?? currentRole;
                  const dirty = selectedRole !== currentRole;
                  const isSaving = !!savingById[userId];

                  return (
                    <TableRow key={userId} hover>
                      <TableCell>{user.name || '-'}</TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{currentRole}</TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <Select
                            value={selectedRole}
                            onChange={(e) =>
                              setEditedRoles((prev) => ({
                                ...prev,
                                [userId]: normalizeRole(e.target.value),
                              }))
                            }
                          >
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="editor">Editor</MenuItem>
                            <MenuItem value="viewer">Viewer</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          size="small"
                          disabled={!dirty || isSaving}
                          onClick={() => void updateRole(userId)}
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
                      No users found.
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
