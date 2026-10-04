'use client';

import { Box, Button, Container, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import BrowserFrame from '@/components/marketing/BrowserFrame';
import DemoCompanyOverview from '@/components/marketing/demo/DemoCompanyOverview';
import { bookDemoHref, bookDemoIsExternal } from '@/components/marketing/bookDemo';
import MarketingHeroImage from '@/components/marketing/MarketingHeroImage';
import { plutus } from '@/theme/tokens';

export default function LandingHero() {
  const theme = useTheme();
  const demoHref = bookDemoHref();
  const demoExternal = bookDemoIsExternal();

  const mock = (
    <BrowserFrame url="app.allatura.com/dashboard" contentScale={0.94}>
      <DemoCompanyOverview />
    </BrowserFrame>
  );

  return (
    <Box
      sx={{
        pt: { xs: 4, md: 6 },
        pb: { xs: 6, md: 10 },
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.85)}`,
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={{ xs: 5, lg: 8 }}
          alignItems={{ lg: 'center' }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                letterSpacing: '0.14em',
                mb: 2,
                display: 'block',
              }}
            >
              Contract & operational control
            </Typography>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontSize: { xs: '2.35rem', sm: '2.75rem', md: '3.35rem' },
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 1.08,
                color: 'text.primary',
                mb: 2,
              }}
            >
              Control every contract, renewal, and payment in one place.
            </Typography>
            <Typography
              variant="h6"
              component="p"
              sx={{
                color: 'text.secondary',
                fontWeight: 400,
                fontSize: { xs: '1.05rem', md: '1.15rem' },
                lineHeight: 1.65,
                mb: 3,
                maxWidth: 520,
              }}
            >
              Never lose visibility over contracts, renewals, suppliers, payments, and operational workflows again.
              Built for teams who outgrew spreadsheets but still need audit-ready records.
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1.5}>
              <Button
                {...(demoExternal
                  ? { component: 'a' as const, href: demoHref, target: '_blank', rel: 'noopener noreferrer' }
                  : { component: Link as typeof Link, href: demoHref })}
                variant="contained"
                size="large"
                sx={{ px: 2.5, py: 1.25, fontWeight: 600, borderRadius: `${plutus.radius.sm}px` }}
              >
                Book demo
              </Button>
              <Button
                component={Link}
                href="/register"
                variant="outlined"
                size="large"
                sx={{ px: 2.5, py: 1.25, fontWeight: 600, borderRadius: `${plutus.radius.sm}px` }}
              >
                Get started
              </Button>
              <Button
                component="a"
                href="/#platform"
                size="large"
                startIcon={<LayoutDashboard size={18} />}
                sx={{ px: 2.5, py: 1.25, fontWeight: 600, color: 'text.primary' }}
              >
                View platform
              </Button>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 3 }} flexWrap="wrap">
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Multi-tenant · Role-based access · Construction-ready workflows
              </Typography>
            </Stack>
          </Box>
          <Box sx={{ flex: 1.1, minWidth: 0, width: 1 }}>
            <MarketingHeroImage
              fallback={mock}
              priority
            />
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
