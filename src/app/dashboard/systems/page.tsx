'use client';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { Server } from 'lucide-react';
import AppCard from '@/components/ui/AppCard';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { getStoredToken } from '@/lib/api-helper';
import { getJwtClaims } from '@/lib/jwt';
import { authFetcher } from '@/lib/swr-fetcher';

type SystemRow = {
  id: string;
  name: string;
  vendor?: string;
  category: string;
  department?: string;
  businessOwner?: { name?: string; email?: string };
  criticality: string;
  annualCost?: number;
  nextRenewal?: string | null;
};

export default function SystemsListPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [criticality, setCriticality] = useState('');
  const [canEdit, setCanEdit] = useState(false);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (category) {
      p.set('category', category);
    }
    if (department) {
      p.set('department', department);
    }
    if (criticality) {
      p.set('criticality', criticality);
    }
    const s = p.toString();
    return s ? `systems?${s}` : 'systems';
  }, [category, department, criticality]);

  const { data: rows, mutate } = useSWR<SystemRow[]>(qs, authFetcher);

  const filtered = useMemo(() => {
    const list = rows ?? [];
    if (!search.trim()) {
      return list;
    }
    const q = search.toLowerCase();
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.vendor ?? '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  const loading = rows === undefined;
  const empty = rows !== undefined && rows.length === 0;
  const noMatches = rows !== undefined && rows.length > 0 && !filtered.length;

  useEffect(() => {
    const role = getJwtClaims(getStoredToken())?.role;
    setCanEdit(role === 'admin' || role === 'editor');
  }, []);

  return (
    <Box>
      <PageHeader
        title="IT systems"
        description="Inventory, ownership, and renewal risk across your stack."
        action={canEdit ? (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            href="/dashboard/systems/new"
            sx={{ fontWeight: 600 }}
          >
            Add system
          </Button>
        ) : undefined}
      />

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2.5,
          alignItems: 'center',
        }}
      >
        <TextField
          size="small"
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 220 } }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Category</InputLabel>
          <Select
            label="Category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              void mutate();
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="SaaS">SaaS</MenuItem>
            <MenuItem value="Infrastructure">Infrastructure</MenuItem>
            <MenuItem value="Internal Tool">Internal Tool</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Department</InputLabel>
          <Select
            label="Department"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              void mutate();
            }}
          >
            <MenuItem value="">All</MenuItem>
            {[...new Set((rows ?? []).map((r) => r.department).filter(Boolean))].map(
              (d) => (
                <MenuItem key={d} value={d!}>
                  {d}
                </MenuItem>
              ),
            )}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Criticality</InputLabel>
          <Select
            label="Criticality"
            value={criticality}
            onChange={(e) => {
              setCriticality(e.target.value);
              void mutate();
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="High">High</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <AppCard>
        <TableContainer sx={{ borderRadius: 2 }}>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell>System</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Business owner</TableCell>
                <TableCell>Criticality</TableCell>
                <TableCell align="right">Annual cost (est.)</TableCell>
                <TableCell>Next renewal</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
                    Loading systems…
                  </TableCell>
                </TableRow>
              )}
              {empty && (
                <TableRow>
                  <TableCell colSpan={9} sx={{ border: 'none', p: 0 }}>
                    <EmptyState
                      embedded
                      icon={Server}
                      title="No systems yet"
                      description="Add your first system or import a spreadsheet to populate this view."
                    />
                  </TableCell>
                </TableRow>
              )}
              {noMatches && (
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                    No systems match your filters.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id} hover sx={{ '&:last-child td': { borderBottom: 'none' } }}>
                  <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                  <TableCell>{r.vendor}</TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell>{r.department}</TableCell>
                  <TableCell>
                    {r.businessOwner?.name || r.businessOwner?.email || '-'}
                  </TableCell>
                  <TableCell>{r.criticality}</TableCell>
                  <TableCell align="right">${(r.annualCost ?? 0).toLocaleString()}</TableCell>
                  <TableCell>
                    {r.nextRenewal
                      ? new Date(r.nextRenewal).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton component={Link} href={`/dashboard/systems/${r.id}`} size="small" aria-label="View">
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    {canEdit ? (
                      <IconButton component={Link} href={`/dashboard/systems/${r.id}/edit`} size="small" aria-label="Edit">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AppCard>
    </Box>
  );
}
