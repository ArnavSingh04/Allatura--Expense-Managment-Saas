'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { LucideIcon } from 'lucide-react';
import AppCard from '@/components/ui/AppCard';

type KpiStatCardProps = {
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent: 'teal' | 'violet' | 'amber' | 'rose';
};

export default function KpiStatCard({ title, value, hint, icon: Icon, accent }: KpiStatCardProps) {
  const theme = useTheme();
  const accents = {
    teal: {
      bg: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.12),
      fg: theme.palette.primary.main,
      border: alpha(theme.palette.primary.main, 0.35),
    },
    violet: {
      bg: alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.22 : 0.12),
      fg: theme.palette.secondary.main,
      border: alpha(theme.palette.secondary.main, 0.35),
    },
    amber: {
      bg: alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.2 : 0.12),
      fg: theme.palette.warning.main,
      border: alpha(theme.palette.warning.main, 0.35),
    },
    rose: {
      bg: alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.2 : 0.1),
      fg: theme.palette.error.main,
      border: alpha(theme.palette.error.main, 0.3),
    },
  };
  const a = accents[accent];

  return (
    <AppCard hover sx={{ height: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
              {title}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.03em',
                fontSize: { xs: '1.5rem', md: '1.75rem' },
                color: 'text.primary',
              }}
            >
              {value}
            </Typography>
            {hint && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {hint}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: a.bg,
              color: a.fg,
              border: `1px solid ${a.border}`,
              flexShrink: 0,
            }}
          >
            <Icon size={22} strokeWidth={2} />
          </Box>
        </Box>
      </Box>
    </AppCard>
  );
}
