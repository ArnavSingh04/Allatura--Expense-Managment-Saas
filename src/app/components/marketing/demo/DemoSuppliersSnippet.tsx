'use client';

import { Box, Stack, Typography } from '@mui/material';
import { Building2, ShieldCheck } from 'lucide-react';
import AppCard from '@/components/ui/AppCard';
import StatusChip from '@/components/construction/StatusChip';

const suppliers = [
  { name: 'Harbour Concrete Pty Ltd', trade: 'Structural', status: 'Active' },
  { name: 'Coastal Electrical', trade: 'Services', status: 'Pending' },
  { name: 'Northwind Scaffolding', trade: 'Access', status: 'Active' },
];

export default function DemoSuppliersSnippet() {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Building2 size={18} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Suppliers & subcontractors
        </Typography>
      </Stack>
      <Stack spacing={1}>
        {suppliers.map((s) => (
          <AppCard key={s.name} hover={false} sx={{ p: 1.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {s.name}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25 }}>
                  <ShieldCheck size={14} />
                  <Typography variant="caption" color="text.secondary">
                    {s.trade} · SWMS on file
                  </Typography>
                </Stack>
              </Box>
              <StatusChip status={s.status} />
            </Stack>
          </AppCard>
        ))}
      </Stack>
    </Box>
  );
}
