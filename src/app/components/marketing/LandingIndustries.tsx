'use client';

import { Box, Container, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import AppCard from '@/components/ui/AppCard';

const cases = [
  {
    title: 'Construction',
    pain: 'Variations, claims, and site reality diverge from what finance sees until it is expensive to reconcile.',
    fix: 'Tie budgets, claims, progress, and documents to each job so commercial and delivery share one operational picture.',
  },
  {
    title: 'Finance teams',
    pain: 'Renewals and supplier exposure hide in inboxes and attachments—reporting becomes a manual archaeology project.',
    fix: 'Structured renewals, registers, and payment states with export-friendly views when you still need the spreadsheet.',
  },
  {
    title: 'Operations',
    pain: 'Subcontractor compliance and job records live in disconnected drives—risk shows up late.',
    fix: 'Central registers, documents, and workflows anchored to projects and contracts—not orphaned folders.',
  },
  {
    title: 'SMEs',
    pain: 'You do not have enterprise IT, but you still need audit trails and visibility as you scale past a few jobs.',
    fix: 'Multi-tenant SaaS with roles and history that punches above its weight for lean commercial teams.',
  },
];

export default function LandingIndustries() {
  return (
    <Box sx={{ py: { xs: 8, md: 11 } }}>
      <Container maxWidth="lg">
        <Typography
          id="industries-heading"
          variant="h2"
          sx={{
            fontSize: { xs: '1.75rem', md: '2.25rem' },
            fontWeight: 700,
            letterSpacing: '-0.03em',
            mb: 1,
          }}
        >
          Built for the way you deliver work
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mb: 4, lineHeight: 1.7 }}>
          Whether you are on site weekly or supporting portfolios from head office, Allatura maps to your operating
          rhythm.
        </Typography>
        <Grid container spacing={2.5}>
          {cases.map((c) => (
            <Grid key={c.title} size={{ xs: 12, md: 6 }}>
              <AppCard sx={{ height: '100%', p: 2.75 }}>
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '0.1em' }}>
                  {c.title}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1, mb: 1.5 }}>
                  The pain
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.65 }}>
                  {c.pain}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  How Allatura helps
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                  {c.fix}
                </Typography>
              </AppCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
