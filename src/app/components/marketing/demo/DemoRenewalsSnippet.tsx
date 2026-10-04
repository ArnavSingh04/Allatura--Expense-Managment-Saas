'use client';

import { Box, Chip, Stack, Typography } from '@mui/material';
import { CalendarClock } from 'lucide-react';
import AppCard from '@/components/ui/AppCard';

const rows = [
  { name: 'Facilities HVAC — master services', days: 18, tier: 'critical' as const },
  { name: 'Scaffold licence — Block C', days: 45, tier: 'soon' as const },
  { name: 'IT support & security retainer', days: 112, tier: 'ok' as const },
];

export default function DemoRenewalsSnippet() {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <CalendarClock size={18} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Renewals pipeline
        </Typography>
      </Stack>
      <Stack spacing={1.25}>
        {rows.map((r) => (
          <AppCard key={r.name} hover={false} sx={{ p: 1.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {r.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Auto reminders · owner assigned
                </Typography>
              </Box>
              <Chip
                size="small"
                label={`${r.days}d`}
                color={r.tier === 'critical' ? 'error' : r.tier === 'soon' ? 'warning' : 'default'}
                sx={{ fontWeight: 700, flexShrink: 0 }}
              />
            </Stack>
          </AppCard>
        ))}
      </Stack>
    </Box>
  );
}
