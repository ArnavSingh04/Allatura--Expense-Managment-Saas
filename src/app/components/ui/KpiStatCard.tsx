'use client';

import { Box, Typography } from '@mui/material';
import type { LucideIcon } from 'lucide-react';
import AppCard from '@/components/ui/AppCard';
import { plutus } from '@/theme/tokens';

type KpiStatCardProps = {
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent: 'teal' | 'violet' | 'amber' | 'rose';
};

const accents = {
  teal: { bg: plutus.color.primarySoft, fg: plutus.color.primary, border: 'rgba(13, 148, 136, 0.25)' },
  violet: { bg: plutus.color.accentVioletSoft, fg: plutus.color.accentViolet, border: 'rgba(99, 102, 241, 0.25)' },
  amber: { bg: plutus.color.accentAmberSoft, fg: plutus.color.accentAmber, border: 'rgba(217, 119, 6, 0.25)' },
  rose: { bg: plutus.color.accentRoseSoft, fg: plutus.color.accentRose, border: 'rgba(225, 29, 72, 0.2)' },
};

export default function KpiStatCard({ title, value, hint, icon: Icon, accent }: KpiStatCardProps) {
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
