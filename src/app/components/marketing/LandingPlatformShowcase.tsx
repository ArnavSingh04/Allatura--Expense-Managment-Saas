'use client';

import { Box, Container, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import BrowserFrame from '@/components/marketing/BrowserFrame';
import DemoCommercialTable from '@/components/marketing/demo/DemoCommercialTable';
import DemoCompanyOverview from '@/components/marketing/demo/DemoCompanyOverview';
import DemoRenewalsSnippet from '@/components/marketing/demo/DemoRenewalsSnippet';
import DemoSuppliersSnippet from '@/components/marketing/demo/DemoSuppliersSnippet';

export default function LandingPlatformShowcase() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: { xs: 8, md: 11 },
        borderTop: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.35 : 0.65),
      }}
    >
      <Container maxWidth="lg">
        <Typography
          id="platform-heading"
          variant="h2"
          sx={{
            fontSize: { xs: '1.75rem', md: '2.25rem' },
            fontWeight: 700,
            letterSpacing: '-0.03em',
            mb: 1,
          }}
        >
          Inside the platform
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680, mb: 5, lineHeight: 1.7 }}>
          Real layouts from the Allatura UI—KPIs, tables, budgets, and registers—composed with the same components your
          team uses after sign-in. Drop high-resolution captures into{' '}
          <Box component="code" sx={{ fontSize: '0.9em', px: 0.75, py: 0.25, borderRadius: 1, bgcolor: 'action.hover' }}>
            public/photos
          </Box>{' '}
          any time you want photography to take the lead.
        </Typography>
        <Stack spacing={4}>
          <BrowserFrame url="app.allatura.com/dashboard" contentScale={0.95}>
            <DemoCompanyOverview />
          </BrowserFrame>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <BrowserFrame url="app.allatura.com/dashboard/renewals" contentScale={0.96}>
                <DemoRenewalsSnippet />
              </BrowserFrame>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <BrowserFrame url="app.allatura.com/dashboard/suppliers" contentScale={0.96}>
                <DemoSuppliersSnippet />
              </BrowserFrame>
            </Box>
          </Stack>
          <BrowserFrame url="app.allatura.com/dashboard/projects/jetty/claims" contentScale={0.96}>
            <DemoCommercialTable />
          </BrowserFrame>
        </Stack>
      </Container>
    </Box>
  );
}
