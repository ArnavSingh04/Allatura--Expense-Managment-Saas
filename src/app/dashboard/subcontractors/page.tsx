'use client';

import {
  Alert,
  Box,
  Button,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  Switch,
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
import { HardHat, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import AppCard from '@/components/ui/AppCard';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import SubcontractorDialog from '@/components/construction/SubcontractorDialog';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { ApiError } from '@/lib/api-client';
import { authFetcher } from '@/lib/swr-fetcher';
import { keys } from '@/lib/swr-keys';
import { subcontractorService } from '@/services/subcontractorService';
import type { Subcontractor } from '@/types/construction';

export default function SubcontractorsPage() {
  const { can } = useAuthSession();
  const [search, setSearch] = useState('');
  const [preferredOnly, setPreferredOnly] = useState(false);
  const [editing, setEditing] = useState<Subcontractor | null>(null);
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const swrKey = useMemo(
    () =>
      keys.subbies({
        q: search || undefined,
        preferredOnly: preferredOnly || undefined,
      }),
    [search, preferredOnly],
  );

  const { data, isLoading, error } = useSWR<Subcontractor[]>(swrKey, authFetcher);

  const refresh = () => void mutate((k: unknown) => typeof k === 'string' && k.startsWith('subcontractors'));

  const remove = async (s: Subcontractor) => {
    if (!confirm(`Delete ${s.name}?`)) return;
    setActionError(null);
    try {
      await subcontractorService.remove(s._id);
      refresh();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Could not delete.');
    }
  };

  const togglePreferred = async (s: Subcontractor) => {
    try {
      await subcontractorService.update(s._id, { preferred: !s.preferred });
      refresh();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Could not update.');
    }
  };

  if (error) return <Alert severity="error">{(error as Error).message}</Alert>;

  return (
    <Box>
      <PageHeader
        title="Subcontractors"
        description="Your trade directory — track licenses, insurance, and contract history."
        action={
          can('subbies.edit') && (
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => setCreating(true)}
            >
              New subcontractor
            </Button>
          )
        }
      />

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ sm: 'center' }}
        sx={{ mb: 2 }}
      >
        <TextField
          size="small"
          label="Search"
          placeholder="Name, trade, ABN…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Stack direction="row" alignItems="center" spacing={1}>
          <Switch
            checked={preferredOnly}
            onChange={(_, v) => setPreferredOnly(v)}
            size="small"
          />
          <Typography variant="body2">Preferred only</Typography>
        </Stack>
      </Stack>

      {isLoading ? (
        <LinearProgress />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={HardHat}
          title="No subcontractors yet"
          description={
            can('subbies.edit')
              ? 'Add your trades so you can award contracts and track compliance.'
              : 'Subcontractors will appear here once added.'
          }
          actionLabel={can('subbies.edit') ? 'Add subcontractor' : undefined}
          onAction={can('subbies.edit') ? () => setCreating(true) : undefined}
        />
      ) : (
        <AppCard>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Trade</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>License expiry</TableCell>
                    <TableCell>Insurance expiry</TableCell>
                    <TableCell align="right">Preferred</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data ?? []).map((s) => {
                    const licExp = s.licenseExpiresAt ? new Date(s.licenseExpiresAt) : null;
                    const insExp = s.insuranceExpiresAt
                      ? new Date(s.insuranceExpiresAt)
                      : null;
                    const isLicExpired = licExp && licExp.getTime() < Date.now();
                    const isInsExpired = insExp && insExp.getTime() < Date.now();
                    return (
                      <TableRow key={s._id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                        <TableCell>{s.trade || '—'}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {s.contactPerson || '—'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {s.email}
                            {s.phone ? ` · ${s.phone}` : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {licExp ? (
                            <Chip
                              size="small"
                              label={licExp.toLocaleDateString()}
                              color={isLicExpired ? 'error' : 'default'}
                              variant={isLicExpired ? 'filled' : 'outlined'}
                            />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          {insExp ? (
                            <Chip
                              size="small"
                              label={insExp.toLocaleDateString()}
                              color={isInsExpired ? 'error' : 'default'}
                              variant={isInsExpired ? 'filled' : 'outlined'}
                            />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => togglePreferred(s)}
                            disabled={!can('subbies.edit')}
                            color={s.preferred ? 'warning' : 'default'}
                          >
                            <Star
                              size={18}
                              fill={s.preferred ? 'currentColor' : 'transparent'}
                            />
                          </IconButton>
                        </TableCell>
                        <TableCell align="right">
                          {can('subbies.edit') && (
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => setEditing(s)}>
                                  <Pencil size={16} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => remove(s)}
                                >
                                  <Trash2 size={16} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </AppCard>
      )}

      <SubcontractorDialog
        open={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        existing={editing ?? undefined}
        onSaved={refresh}
      />
    </Box>
  );
}
