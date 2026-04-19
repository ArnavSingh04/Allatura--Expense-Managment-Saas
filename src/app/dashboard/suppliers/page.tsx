'use client';

import {
  Alert,
  Box,
  Button,
  CardContent,
  IconButton,
  LinearProgress,
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
import { Pencil, Plus, Trash2, Truck } from 'lucide-react';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import AppCard from '@/components/ui/AppCard';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import SupplierDialog from '@/components/construction/SupplierDialog';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { ApiError } from '@/lib/api-client';
import { authFetcher } from '@/lib/swr-fetcher';
import { keys } from '@/lib/swr-keys';
import { supplierService } from '@/services/supplierService';
import type { Supplier } from '@/types/construction';

export default function SuppliersPage() {
  const { can } = useAuthSession();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, error } = useSWR<Supplier[]>(
    keys.suppliers({ q: search || undefined }),
    authFetcher,
  );

  const refresh = () =>
    void mutate((k: unknown) => typeof k === 'string' && k.startsWith('suppliers'));

  const remove = async (s: Supplier) => {
    if (!confirm(`Delete ${s.name}?`)) return;
    setActionError(null);
    try {
      await supplierService.remove(s._id);
      refresh();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Could not delete.');
    }
  };

  if (error) return <Alert severity="error">{(error as Error).message}</Alert>;

  return (
    <Box>
      <PageHeader
        title="Suppliers"
        description="Materials, fixtures, fittings — your purchasing rolodex."
        action={
          can('suppliers.edit') && (
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => setCreating(true)}
            >
              New supplier
            </Button>
          )
        }
      />

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}

      <TextField
        size="small"
        label="Search"
        placeholder="Name or category"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: { xs: '100%', sm: 320 } }}
      />

      {isLoading ? (
        <LinearProgress />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Truck}
          title="No suppliers yet"
          description={
            can('suppliers.edit')
              ? 'Add suppliers to capture materials and equipment costs against jobs.'
              : 'Suppliers will appear here once added.'
          }
          actionLabel={can('suppliers.edit') ? 'Add supplier' : undefined}
          onAction={can('suppliers.edit') ? () => setCreating(true) : undefined}
        />
      ) : (
        <AppCard>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Account</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data ?? []).map((s) => (
                    <TableRow key={s._id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                      <TableCell>{s.category || '—'}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{s.email || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.phone || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>{s.accountNumber || '—'}</TableCell>
                      <TableCell align="right">
                        {can('suppliers.edit') && (
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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </AppCard>
      )}

      <SupplierDialog
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
