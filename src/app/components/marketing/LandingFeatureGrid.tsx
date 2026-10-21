'use client';

import { Box, Chip, Container, Stack, Typography, useTheme } from '@mui/material';
import Grid from '@mui/material/Grid';
import { alpha } from '@mui/material/styles';
import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  Building2,
  CalendarClock,
  FileText,
  FolderOpen,
  Hammer,
  Landmark,
  Wallet,
} from 'lucide-react';
import { plutus } from '@/theme/tokens';

type Feature = {
  title: string;
  body: string;
  icon: LucideIcon;
  roadmap?: boolean;
};

const features: Feature[] = [
  {
    title: 'Contract management',
    body: 'Centralise issued, signed, and varied agreements with clear status and ownership.',
    icon: FileText,
  },
  {
    title: 'Renewal tracking',
    body: 'See what is expiring next, assign owners, and reduce surprise lapses across the portfolio.',
    icon: CalendarClock,
  },
  {
    title: 'Suppliers & subcontractors',
    body: 'Registers, compliance context, and relationships tied to the jobs that depend on them.',
    icon: Building2,
  },
  {
    title: 'Payment tracking',
    body: 'Claims, certification stages, and cash visibility aligned to project delivery.',
    icon: Wallet,
  },
  {
    title: 'Construction workflows',
    body: 'Budget, progress, site records, and commercial signals in one operational thread.',
    icon: Hammer,
  },
  {
    title: 'Document storage',
    body: 'Keep drawings, registers, and correspondence where finance and delivery teams can find them.',
    icon: FolderOpen,
  },
  {
    title: 'Xero integration',
    body: 'Prepare to sync costs and commitments with your ledger—fewer manual bridges between systems.',
    icon: Landmark,
    roadmap: true,
  },
  {
    title: 'AI-assisted insights',
    body: 'Surface obligations, anomalies, and renewal risk from your contract corpus—without extra admin.',
    icon: Bot,
    roadmap: true,
  },
];

export default function LandingFeatureGrid() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ py: { xs: 8, md: 11 } }}>
      <Container maxWidth="lg">
        <Typography
          id="features-heading"
          variant="h2"
          sx={{
            fontSize: { xs: '1.75rem', md: '2.25rem' },
            fontWeight: 700,
            letterSpacing: '-0.03em',
            mb: 1,
          }}
        >
          Everything your commercial and ops teams expect
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mb: 5, lineHeight: 1.7 }}>
          From renewals to payment claims, Allatura is structured around how capital projects are actually delivered—not
          how generic CRMs wish they were.
        </Typography>
        <Grid container spacing={2.5}>
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Grid key={f.title} size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    p: 2.5,
                    borderRadius: `${plutus.radius.lg}px`,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: 'background.paper',
                    boxShadow: isDark
                      ? '0 1px 2px rgba(0, 0, 0, 0.35), 0 4px 16px rgba(0, 0, 0, 0.25)'
                      : plutus.shadow.card,
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                    '&:hover': {
                      boxShadow: isDark
                        ? '0 4px 20px rgba(0, 0, 0, 0.45), 0 8px 24px rgba(0, 0, 0, 0.3)'
                        : plutus.shadow.cardHover,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(theme.palette.primary.main, isDark ? 0.2 : 0.12),
                        color: 'primary.main',
                      }}
                    >
                      <Icon size={20} />
                    </Box>
                    {f.roadmap ? (
                      <Chip label="Coming soon" size="small" color="secondary" sx={{ fontWeight: 700 }} />
                    ) : null}
                  </Stack>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0, lineHeight: 1.65, flexGrow: 0 }}>
                    {f.body}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}
