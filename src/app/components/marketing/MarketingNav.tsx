'use client';

import {
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Menu, Moon, Sun, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useColorMode } from '@/lib/colorModeContext';
import { bookDemoHref, bookDemoIsExternal } from '@/components/marketing/bookDemo';
import AllaturaWordmark from '@/components/shared/AllaturaWordmark';
import { plutus } from '@/theme/tokens';

const nav = [
  { label: 'Product', href: '/#features' },
  { label: 'How it works', href: '/#how' },
  { label: 'Industries', href: '/#industries' },
  { label: 'Platform', href: '/#platform' },
  { label: 'Pricing', href: '/plans' },
  { label: 'Contact', href: '/contact' },
];

export default function MarketingNav() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { preference, setPreference } = useColorMode();
  const [drawer, setDrawer] = useState(false);
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));

  const demoHref = bookDemoHref();
  const demoExternal = bookDemoIsExternal();

  const toggleTheme = () => {
    setPreference(preference === 'dark' ? 'light' : 'dark');
  };

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: theme.zIndex.appBar,
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: (th) => alpha(th.palette.background.paper, isDark ? 0.82 : 0.78),
        backdropFilter: 'blur(14px)',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 1.75 }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <AllaturaWordmark sx={{ fontSize: '1.125rem', letterSpacing: '-0.03em' }}>ALLATURA</AllaturaWordmark>
          </Link>

          {mdUp ? (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flex: 1, justifyContent: 'center' }}>
              {nav.map((item) => (
                <Button
                  key={item.href}
                  component={Link}
                  href={item.href}
                  color="inherit"
                  sx={{ fontWeight: 600, color: 'text.secondary', px: 1.25 }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          ) : (
            <Box sx={{ flex: 1 }} />
          )}

          <Stack direction="row" alignItems="center" spacing={0.5}>
            <IconButton
              onClick={toggleTheme}
              aria-label={preference === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              {preference === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </IconButton>
            {!mdUp && (
              <IconButton aria-label="Open menu" onClick={() => setDrawer(true)} size="small" sx={{ color: 'text.secondary' }}>
                <Menu size={20} />
              </IconButton>
            )}
            {mdUp && (
              <>
                <Button
                  {...(demoExternal
                    ? { component: 'a' as const, href: demoHref, target: '_blank', rel: 'noopener noreferrer' }
                    : { component: Link as typeof Link, href: demoHref })}
                  color="inherit"
                  sx={{ fontWeight: 600, display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  Book demo
                </Button>
                <Button component={Link} href="/login" color="inherit" sx={{ fontWeight: 600 }}>
                  Sign in
                </Button>
                <Button
                  component={Link}
                  href="/register"
                  variant="contained"
                  sx={{ fontWeight: 600, borderRadius: `${plutus.radius.sm}px` }}
                >
                  Get started
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </Container>

      {!mdUp && drawer && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: theme.zIndex.modal,
            bgcolor: alpha(theme.palette.background.default, 0.96),
            backdropFilter: 'blur(8px)',
            p: 2,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <AllaturaWordmark>ALLATURA</AllaturaWordmark>
            <IconButton aria-label="Close menu" onClick={() => setDrawer(false)}>
              <X size={22} />
            </IconButton>
          </Stack>
          <Stack spacing={1}>
            {nav.map((item) => (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                onClick={() => setDrawer(false)}
                fullWidth
                sx={{ justifyContent: 'flex-start', fontWeight: 600, py: 1.5 }}
              >
                {item.label}
              </Button>
            ))}
            <Button
              {...(demoExternal
                ? { component: 'a' as const, href: demoHref, target: '_blank', rel: 'noopener noreferrer' }
                : { component: Link as typeof Link, href: demoHref })}
              fullWidth
              sx={{ justifyContent: 'flex-start', fontWeight: 600, py: 1.5 }}
              onClick={() => setDrawer(false)}
            >
              Book demo
            </Button>
            <Button component={Link} href="/login" fullWidth sx={{ justifyContent: 'flex-start', fontWeight: 600, py: 1.5 }} onClick={() => setDrawer(false)}>
              Sign in
            </Button>
            <Button component={Link} href="/register" variant="contained" fullWidth sx={{ fontWeight: 600, py: 1.5 }} onClick={() => setDrawer(false)}>
              Get started
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
