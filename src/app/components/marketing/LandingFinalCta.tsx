'use client';

import { Box, Button, Container, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { bookDemoHref, bookDemoIsExternal } from '@/components/marketing/bookDemo';
import Link from 'next/link';
import { plutus } from '@/theme/tokens';

export default function LandingFinalCta() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const demoHref = bookDemoHref();
  const demoExternal = bookDemoIsExternal();

  return (
    <Box sx={{ py: { xs: 8, md: 10 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: `${plutus.radius.xl}px`,
            px: { xs: 3, md: 6 },
            py: { xs: 5, md: 7 },
            border: `1px solid ${theme.palette.divider}`,
            background: isDark
              ? `linear-gradient(135deg, ${alpha('#d4af37', 0.2)} 0%, ${alpha('#4a3728', 0.35)} 55%, ${alpha('#101610', 0.92)} 100%)`
              : `linear-gradient(135deg, ${alpha('#1b3022', 0.1)} 0%, ${alpha('#d4af37', 0.14)} 50%, ${alpha('#ffffff', 0.96)} 100%)`,
            boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.35)' : plutus.shadow.cardHover,
          }}
        >
          <Stack spacing={2} alignItems={{ xs: 'stretch', md: 'flex-start' }} sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.65rem', md: '2.25rem' },
                fontWeight: 700,
                letterSpacing: '-0.03em',
                maxWidth: 560,
              }}
            >
              Ready for a calmer commercial rhythm?
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 520, lineHeight: 1.7 }}>
              Book a walkthrough with your workflows, or create an account and invite your team when you are ready to
              migrate off spreadsheets.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1 }}>
              <Button
                {...(demoExternal
                  ? { component: 'a' as const, href: demoHref, target: '_blank', rel: 'noopener noreferrer' }
                  : { component: Link as typeof Link, href: demoHref })}
                variant="contained"
                size="large"
                sx={{ fontWeight: 600, px: 3, borderRadius: `${plutus.radius.sm}px` }}
              >
                Book demo
              </Button>
              <Button
                component={Link}
                href="/register"
                variant="outlined"
                size="large"
                sx={{ fontWeight: 600, px: 3, borderRadius: `${plutus.radius.sm}px`, bgcolor: 'background.paper' }}
              >
                Get started
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
