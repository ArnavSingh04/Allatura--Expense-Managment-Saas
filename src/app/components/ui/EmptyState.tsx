'use client';

import { Box, Button, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { LucideIcon } from 'lucide-react';
import AppCard from '@/components/ui/AppCard';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Omit outer card, for use inside tables or other cards */
  embedded?: boolean;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  embedded = false,
}: EmptyStateProps) {
  const theme = useTheme();
  const inner = (
    <Box
      sx={{
        py: embedded ? 4 : 6,
        px: 3,
        textAlign: 'center',
        maxWidth: 420,
        mx: 'auto',
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: 3,
          mx: 'auto',
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.12),
          color: theme.palette.primary.main,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
        }}
      >
        <Icon size={28} strokeWidth={1.75} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: actionLabel ? 2 : 0 }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" color="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );

  if (embedded) {
    return inner;
  }

  return <AppCard>{inner}</AppCard>;
}
