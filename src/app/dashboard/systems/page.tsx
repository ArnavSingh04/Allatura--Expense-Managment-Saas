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
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { authFetcher } from '@/lib/swr-fetcher';
import {
  dashboardHeader,
  dashboardSubheader,
} from '@/styles/MaterialStyles/shared/sharedStyles';

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

  return (
    <Box>
      <Typography sx={dashboardHeader}>IT systems</Typography>
      <Typography sx={dashboardSubheader} gutterBottom>
        Inventory and ownership
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
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
        <FormControl size="small" sx={{ minWidth: 140 }}>
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
        <FormControl size="small" sx={{ minWidth: 140 }}>
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          href="/dashboard/systems/new"
        >
          Add system
        </Button>
      </Box>

      <Table size="small">
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
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.name}</TableCell>
              <TableCell>{r.vendor}</TableCell>
              <TableCell>{r.category}</TableCell>
              <TableCell>{r.department}</TableCell>
              <TableCell>
                {r.businessOwner?.name || r.businessOwner?.email || '—'}
              </TableCell>
              <TableCell>{r.criticality}</TableCell>
              <TableCell align="right">
                ${(r.annualCost ?? 0).toLocaleString()}
              </TableCell>
              <TableCell>
                {r.nextRenewal
                  ? new Date(r.nextRenewal).toLocaleDateString()
                  : '—'}
              </TableCell>
              <TableCell>
                <IconButton component={Link} href={`/dashboard/systems/${r.id}`} size="small" aria-label="view">
                  <VisibilityIcon fontSize="small" />
                </IconButton>
                <IconButton component={Link} href={`/dashboard/systems/${r.id}/edit`} size="small" aria-label="edit">
                  <EditIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
