'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { plutus } from '@/theme/tokens';

export type BrowserFrameProps = {
  url: string;
  children: ReactNode;
  /** 0–1 scale for dense mock content */
  contentScale?: number;
};

export default function BrowserFrame({ url, children, contentScale = 1 }: BrowserFrameProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        borderRadius: `${plutus.radius.xl}px`,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: isDark
          ? '0 24px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)'
          : '0 24px 80px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.04)',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        aria-hidden
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1.25,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: isDark ? alpha(theme.palette.common.white, 0.04) : alpha(theme.palette.common.black, 0.02),
        }}
      >
        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff5f57' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#febc2e' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#28c840' }} />
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            minWidth: 0,
          }}
        >
          <Typography
            variant="caption"
            noWrap
            sx={{
              px: 2,
              py: 0.5,
              borderRadius: 999,
              bgcolor: isDark ? alpha(theme.palette.common.white, 0.06) : alpha(theme.palette.common.black, 0.04),
              color: 'text.secondary',
              fontWeight: 500,
              maxWidth: '100%',
            }}
          >
            {url}
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          transform: contentScale !== 1 ? `scale(${contentScale})` : undefined,
          transformOrigin: 'top center',
          width: contentScale !== 1 ? `${100 / contentScale}%` : undefined,
          mx: contentScale !== 1 ? 'auto' : undefined,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
