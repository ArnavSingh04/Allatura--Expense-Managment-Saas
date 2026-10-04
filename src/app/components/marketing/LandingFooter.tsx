'use client';

import { Box, Container, Divider, Link as MuiLink, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import AllaturaWordmark from '@/components/shared/AllaturaWordmark';

const footer = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Platform', href: '/#platform' },
      { label: 'Pricing', href: '/plans' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', href: '/login' },
      { label: 'Get started', href: '/register' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Contact', href: '/contact' },
      { label: 'Book a demo', href: '/#contact' },
    ],
  },
];

export default function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <Box component="footer" sx={{ py: 6, borderTop: 1, borderColor: 'divider' }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} justifyContent="space-between" sx={{ mb: 4 }}>
          <Box>
            <AllaturaWordmark sx={{ mb: 1 }}>ALLATURA</AllaturaWordmark>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280, lineHeight: 1.65 }}>
              Multi-tenant SaaS for contracts, renewals, suppliers, payments, and construction delivery workflows.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
            {footer.map((col) => (
              <Box key={col.title} sx={{ minWidth: 140 }}>
                <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.08em', color: 'text.secondary' }}>
                  {col.title}
                </Typography>
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  {col.links.map((l) => (
                    <MuiLink
                      key={l.label}
                      component={Link}
                      href={l.href}
                      underline="hover"
                      color="text.primary"
                      sx={{ fontWeight: 600, fontSize: '0.9rem' }}
                    >
                      {l.label}
                    </MuiLink>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            © {year} Allatura. All rights reserved.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Built for SMEs, construction, finance, and operations teams.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
