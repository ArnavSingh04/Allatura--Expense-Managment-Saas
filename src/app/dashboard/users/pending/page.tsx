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
import { useState } from 'react';
import useSWR from 'swr';
import RequireAdmin from '@/components/auth/RequireAdmin';
import AppCard from '@/components/ui/AppCard';
import PageHeader from '@/components/ui/PageHeader';
import { ApiHelper, REQUEST_TYPE } from '@/lib/api-helper';
import { authFetcher } from '@/lib/swr-fetcher';

type AccessRequestRow = {
  id: string;
  userId: string;
  email: string;
  name: string;
  userStatus?: 'PendingApproval' | 'Active' | 'Rejected';
  currentRole?: 'admin' | 'editor' | 'viewer';
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  requestedAt?: string;
  reviewedAt?: string;
};

type UserRole = 'admin' | 'editor' | 'viewer';

export default function PendingRequestsPage() {
  return (
    <RequireAdmin>
      <PendingRequestsContent />
    </RequireAdmin>
  );
}

function PendingRequestsContent() {
  const { data, mutate, isLoading } = useSWR<AccessRequestRow[]>(
    'access-requests?status=Pending',
    authFetcher,
  );
  const [selectedRole, setSelectedRole] = useState<Record<string, UserRole>>(
    {},
  );
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const rows = Array.isArray(data) ? data : [];

  const approve = async (id: string) => {
    const role = selectedRole[id] ?? 'viewer';
    setBusy((b) => ({ ...b, [id]: true }));
    setError('');
    setMessage('');
    const api = new ApiHelper(`access-requests/${id}/approve`);
    api.includeKey = false;
    api.type = REQUEST_TYPE.POST;
    api.body = { role };
    const res = (await api.fetchRequest()) as {
      failed?: boolean;
      error?: string;
    };
    setBusy((b) => ({ ...b, [id]: false }));
    if (res?.failed) {
      setError(res.error || 'Could not approve the request.');
      return;
    }
    setMessage(`Approved as ${role}.`);
    await mutate();
  };

  const reject = async (id: string) => {
    setBusy((b) => ({ ...b, [id]: true }));
    setError('');
    setMessage('');
    const api = new ApiHelper(`access-requests/${id}/reject`);
    api.includeKey = false;
    api.type = REQUEST_TYPE.POST;
    api.body = { reason: rejectReason[id]?.trim() || undefined };
    const res = (await api.fetchRequest()) as {
      failed?: boolean;
      error?: string;
    };
    setBusy((b) => ({ ...b, [id]: false }));
    if (res?.failed) {
      setError(res.error || 'Could not reject the request.');
      return;
    }
    setMessage('Request rejected.');
    await mutate();
  };

  return (
    <Box>
      <PageHeader
        title="Pending access requests"
        description="Approve new users and assign them a role, or reject the request."
      />
      <AppCard>
        <Box sx={{ p: { xs: 2, md: 2.5 } }}>
          {message && <Chip color="success" label={message} sx={{ mb: 2 }} />}
          {error && <Chip color="error" label={error} sx={{ mb: 2 }} />}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Requested</TableCell>
                  <TableCell>Approve as</TableCell>
                  <TableCell>Reject reason (optional)</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  const role = selectedRole[row.id] ?? 'viewer';
                  const isBusy = !!busy[row.id];
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.name || '-'}</TableCell>
                      <TableCell>{row.email || '-'}</TableCell>
                      <TableCell>
                        {row.requestedAt
                          ? new Date(row.requestedAt).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 130 }}>
                          <InputLabel>Role</InputLabel>
                          <Select
                            label="Role"
                            value={role}
                            onChange={(e) =>
                              setSelectedRole((prev) => ({
                                ...prev,
                                [row.id]: e.target.value as UserRole,
                              }))
                            }
                          >
                            <MenuItem value="viewer">Viewer</MenuItem>
                            <MenuItem value="editor">Editor</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          placeholder="(optional)"
                          value={rejectReason[row.id] ?? ''}
                          onChange={(e) =>
                            setRejectReason((prev) => ({
                              ...prev,
                              [row.id]: e.target.value,
                            }))
                          }
                          inputProps={{ maxLength: 500 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          <Button
                            variant="contained"
                            size="small"
                            disabled={isBusy}
                            onClick={() => void approve(row.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            disabled={isBusy}
                            onClick={() => void reject(row.id)}
                          >
                            Reject
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
                      sx={{
                        py: 5,
                        textAlign: 'center',
                        color: 'text.secondary',
                      }}
                    >
                      No pending requests.
                    </TableCell>
                  </TableRow>
                )}
                {isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      sx={{
                        py: 5,
                        textAlign: 'center',
                        color: 'text.secondary',
                      }}
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 2 }}
          >
            Approved users gain immediate access (their next API call within
            ~30s revalidates the new role/status).
          </Typography>
        </Box>
      </AppCard>
    </Box>
  );
}
