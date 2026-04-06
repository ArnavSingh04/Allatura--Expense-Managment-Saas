'use client';

import { Box, Button, Container, Typography } from '@mui/material';
import { ArrowRight, BarChart3, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { plutus } from '@/theme/tokens';

export default function HomePage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: plutus.color.bg,
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 50% -20%, rgba(13, 148, 136, 0.15), transparent),
          radial-gradient(ellipse 60% 40% at 100% 0%, rgba(99, 102, 241, 0.08), transparent)
        `,
      }}
    >
      <Box
        component="header"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 4 },
          py: 2,
          borderBottom: `1px solid ${plutus.color.border}`,
          bgcolor: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Typography className="customfont" sx={{ fontSize: '1.125rem' }}>
          PLUTUS
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button component={Link} href="/login" color="inherit" sx={{ fontWeight: 600 }}>
            Sign in
          </Button>
          <Button component={Link} href="/register" variant="contained" sx={{ fontWeight: 600 }}>
            Get started
          </Button>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ maxWidth: 720, mx: 'auto', textAlign: 'center' }}>
          <Typography
            variant="overline"
            sx={{
              color: plutus.color.primary,
              fontWeight: 700,
              letterSpacing: '0.12em',
              mb: 2,
              display: 'block',
            }}
          >
            IT spend intelligence
          </Typography>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.25rem', md: '3.25rem' },
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              color: plutus.color.text,
              mb: 2,
            }}
          >
            Know what you spend — before renewals surprise you.
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: plutus.color.muted,
              fontWeight: 400,
              fontSize: { xs: '1rem', md: '1.125rem' },
              lineHeight: 1.6,
              mb: 4,
            }}
          >
            Plutus centralizes systems, contracts, and renewals in one calm dashboard. Built for teams who outgrew
            spreadsheets.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              href="/dashboard"
              variant="contained"
              size="large"
              endIcon={<ArrowRight size={18} />}
              sx={{ px: 3, py: 1.25, fontWeight: 600 }}
            >
              Open dashboard
            </Button>
            <Button component={Link} href="/login" variant="outlined" size="large" sx={{ px: 3, py: 1.25, fontWeight: 600 }}>
              Sign in
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            mt: { xs: 8, md: 10 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 2.5,
          }}
        >
          {[
            {
              icon: BarChart3,
              title: 'Portfolio visibility',
              body: 'Spend by category, renewal windows, and risk signals in one place.',
            },
            {
              icon: Shield,
              title: 'Ownership & audit',
              body: 'Business owners, duplicate vendors, and change history you can trust.',
            },
            {
              icon: Sparkles,
              title: 'Investor-ready polish',
              body: 'A product experience that matches the quality of your data model.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <Box
              key={title}
              sx={{
                p: 3,
                borderRadius: `${plutus.radius.lg}px`,
                border: `1px solid ${plutus.color.border}`,
                bgcolor: plutus.color.surface,
                boxShadow: plutus.shadow.card,
                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                '&:hover': {
                  boxShadow: plutus.shadow.cardHover,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: plutus.color.primarySoft,
                  color: plutus.color.primary,
                  mb: 2,
                }}
              >
                <Icon size={20} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {body}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
