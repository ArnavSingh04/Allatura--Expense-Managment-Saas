'use client';

import { Box, Stack, Typography } from '@mui/material';
import AppCard from '@/components/ui/AppCard';
import type { ImportPreviewSummary } from '@/types/imports';

type Tile = {
  label: string;
  value: number;
  color?: 'text.primary' | 'success.main' | 'warning.main' | 'error.main';
};

export default function ImportSummaryTiles({
  summary,
}: {
  summary: ImportPreviewSummary;
}) {
  const tiles: Tile[] = [
    { label: 'Detected', value: summary.detected },
    { label: 'Valid', value: summary.valid, color: 'success.main' },
    { label: 'Duplicates', value: summary.duplicates, color: 'warning.main' },
    { label: 'Invalid', value: summary.invalid, color: 'error.main' },
  ];

  return (
    <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
      {tiles.map((tile) => (
        <AppCard key={tile.label} sx={{ flex: '1 1 120px', minWidth: 110 }}>
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="overline" color="text.secondary">
              {tile.label}
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 600, color: tile.color ?? 'text.primary' }}
            >
              {tile.value}
            </Typography>
          </Box>
        </AppCard>
      ))}
    </Stack>
  );
}
