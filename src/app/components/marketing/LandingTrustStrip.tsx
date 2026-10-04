'use client';

import { Box, Container, Typography, useTheme } from '@mui/material';
import Grid from '@mui/material/Grid';
import { alpha } from '@mui/material/styles';
import AppCard from '@/components/ui/AppCard';

const stats = [
  { label: 'Missed renewals', value: 'Fewer surprises', detail: 'Pipeline and ownership on every obligation.' },
  { label: 'Operational visibility', value: 'One thread', detail: 'Budget, claims, and records aligned to each job.' },
  { label: 'Spreadsheet load', value: 'Less re-keying', detail: 'Structured data with exports when you need them.' },
  { label: 'Admin & audit time', value: 'Faster answers', detail: 'History and registers stakeholders can trust.' },
];

export default function LandingTrustStrip() {
  const theme = useTheme();

  return (
    <Box sx={{ py: { xs: 8, md: 10 } }}>
      <Container maxWidth="lg">
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: '1.65rem', md: '2.1rem' },
            fontWeight: 700,
            letterSpacing: '-0.03em',
            mb: 1,
          }}
        >
          Why teams switch from “spreadsheet plus inbox”
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mb: 4, lineHeight: 1.7 }}>
          Designed outcomes you can stand behind in board meetings and on site—without overpromising magic automation.
        </Typography>
        <Grid container spacing={2}>
          {stats.map((s) => (
            <Grid key={s.label} size={{ xs: 12, sm: 6, md: 3 }}>
              <AppCard sx={{ p: 2.5, height: '100%', bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.05 : 0.04) }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.06em' }}>
                  {s.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, my: 1, letterSpacing: '-0.02em' }}>
                  {s.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                  {s.detail}
                </Typography>
              </AppCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
