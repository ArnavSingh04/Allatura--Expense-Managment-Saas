'use client';

import { Box, Button, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';

/**
 * Shared marketing/public navbar used on the homepage and the /plans pricing
 * page so navigation stays consistent (and in place) as visitors move between
 * them. It is sticky so it remains pinned to the top while scrolling.
 */
export default function MarketingHeader() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: (th) => th.zIndex.appBar,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, md: 4 },
        py: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: (th) => alpha(th.palette.background.paper, isDark ? 0.75 : 0.7),
        backdropFilter: 'blur(12px)',
      }}
    >
      <Typography
        component={Link}
        href="/"
        className="customfont"
        sx={{ fontSize: '1.125rem', color: 'text.primary', textDecoration: 'none' }}
      >
        ALLATURA
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Button component={Link} href="/plans" color="inherit" sx={{ fontWeight: 600 }}>
          Pricing
        </Button>
        <Button component={Link} href="/contact" color="inherit" sx={{ fontWeight: 600 }}>
          Contact
        </Button>
        <Button component={Link} href="/login" color="inherit" sx={{ fontWeight: 600 }}>
          Sign in
        </Button>
        <Button component={Link} href="/register" variant="contained" sx={{ fontWeight: 600 }}>
          Get started
        </Button>
      </Box>
    </Box>
  );
}
