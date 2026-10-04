'use client';

import { Box, Container, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CloudUpload, LineChart, Shield, BellRing } from 'lucide-react';
import { plutus } from '@/theme/tokens';

const steps = [
  {
    n: '01',
    title: 'Upload contracts & records',
    body: 'Bring agreements, registers, and job documents into a tenant-scoped workspace your teams already permissioned.',
    icon: CloudUpload,
  },
  {
    n: '02',
    title: 'Track suppliers, payments & workflows',
    body: 'Connect commercial activity to projects—claims, variations, renewals, and spend in one legible thread.',
    icon: LineChart,
  },
  {
    n: '03',
    title: 'Get renewal signals & audit-ready history',
    body: 'Alerts and timelines reduce missed renewals; the audit trail shows what changed, when, and by whom.',
    icon: BellRing,
  },
  {
    n: '04',
    title: 'Decide with portfolio visibility',
    body: 'Leadership sees exposure and progress across jobs—without exporting another fragile spreadsheet.',
    icon: Shield,
  },
];

export default function LandingHowItWorks() {
  const theme = useTheme();

  return (
    <Box sx={{ py: { xs: 8, md: 11 }, bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.06 : 0.04) }}>
      <Container maxWidth="lg">
        <Typography
          id="how-heading"
          variant="h2"
          sx={{
            fontSize: { xs: '1.75rem', md: '2.25rem' },
            fontWeight: 700,
            letterSpacing: '-0.03em',
            mb: 1,
          }}
        >
          How it works
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mb: 5, lineHeight: 1.7 }}>
          A straight path from scattered files to operational clarity—without forcing your teams into a heavyweight ERP.
        </Typography>
        <Stack spacing={0}>
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const last = idx === steps.length - 1;
            return (
              <Stack
                key={s.n}
                direction={{ xs: 'column', md: 'row' }}
                spacing={{ xs: 2, md: 4 }}
                sx={{
                  py: 3,
                  borderBottom: last ? 'none' : `1px solid ${theme.palette.divider}`,
                  alignItems: { md: 'flex-start' },
                }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 800,
                    color: 'primary.main',
                    letterSpacing: '0.12em',
                    minWidth: 48,
                  }}
                >
                  {s.n}
                </Typography>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: `${plutus.radius.md}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.2 : 0.12),
                    color: 'secondary.main',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {s.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, maxWidth: 560 }}>
                    {s.body}
                  </Typography>
                </Box>
              </Stack>
            );
          })}
        </Stack>
      </Container>
    </Box>
  );
}
