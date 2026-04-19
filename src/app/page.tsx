'use client';

import { Box, Button, Container, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ArrowRight, ClipboardList, Files, GanttChartSquare } from 'lucide-react';
import Link from 'next/link';
import { plutus } from '@/theme/tokens';

export default function HomePage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        backgroundImage: isDark
          ? `
          radial-gradient(ellipse 80% 50% at 50% -20%, rgba(45, 212, 191, 0.12), transparent),
          radial-gradient(ellipse 60% 40% at 100% 0%, rgba(129, 140, 248, 0.1), transparent)
        `
          : `
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
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: (th) => alpha(th.palette.background.paper, isDark ? 0.75 : 0.7),
          backdropFilter: 'blur(12px)',
        }}
      >
        <Typography className="customfont" sx={{ fontSize: '1.125rem' }}>
          ALLATURA
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
              color: 'primary.main',
              fontWeight: 700,
              letterSpacing: '0.12em',
              mb: 2,
              display: 'block',
            }}
          >
            Project delivery & commercial control
          </Typography>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.25rem', md: '3.25rem' },
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              color: 'text.primary',
              mb: 2,
            }}
          >
            One place for portfolio financials, contracts, and what happens on the ground.
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              fontWeight: 400,
              fontSize: { xs: '1rem', md: '1.125rem' },
              lineHeight: 1.6,
              mb: 4,
            }}
          >
            Allatura connects budgets, commercial workflows, and records across every job—ideal when you deliver
            capital projects in construction, infrastructure, facilities, or industrial programs, without living in
            disconnected spreadsheets.
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
              icon: GanttChartSquare,
              title: 'Portfolio & project control',
              body: 'Company-wide KPIs plus per-project budgets, milestones, progress, and site context so leadership and delivery stay aligned.',
            },
            {
              icon: ClipboardList,
              title: 'Commercial workflows',
              body: 'Contracts, variations, payment claims, and expenses tied to the work—so exposure, approvals, and cash position stay legible.',
            },
            {
              icon: Files,
              title: 'Records & relationships',
              body: 'Central documents, subcontractor and supplier registers, and an audit trail you can rely on when stakeholders ask what changed.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <Box
              key={title}
              sx={{
                p: 3,
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
