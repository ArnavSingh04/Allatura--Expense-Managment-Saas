'use client';

import {
  Avatar,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { Moon, Shield, Sun } from 'lucide-react';
import { useMemo } from 'react';
import AppCard from '@/components/ui/AppCard';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { useColorMode, type ColorModePreference } from '@/lib/colorModeContext';
import { dashboardHeader } from '@/styles/MaterialStyles/shared/sharedStyles';

function displayName(name?: string, email?: string): string {
  const n = (name || '').trim();
  if (n) return n;
  if (email) return email.split('@')[0] ?? email;
  return '';
}

function initials(name?: string, email?: string): string {
  const n = (name || '').trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return '?';
}

export default function SettingsPage() {
  const { preference, setPreference } = useColorMode();
  const { session, signOut } = useAuthSession();

  const greeting = useMemo(
    () => displayName(undefined, session?.email),
    [session?.email],
  );
  const avatarLetter = useMemo(
    () => initials(undefined, session?.email),
    [session?.email],
  );

  const handleAppearance = (
    _: React.MouseEvent<HTMLElement>,
    value: ColorModePreference | null,
  ) => {
    if (value !== null) {
      setPreference(value);
    }
  };

  return (
    <Box>
      <Typography sx={dashboardHeader}>Settings</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Profile, appearance, and session
      </Typography>

      <Stack spacing={2.5}>
        <AppCard>
          <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="flex-start"
              sx={{ mb: 2 }}
            >
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  fontSize: '1rem',
                  fontWeight: 700,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                }}
                aria-hidden
              >
                {avatarLetter}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Profile
                </Typography>
                {greeting && (
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, mt: 0.5, letterSpacing: '-0.02em' }}
                  >
                    {greeting}
                  </Typography>
                )}
                {session?.email && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {session.email}
                  </Typography>
                )}
                {session?.role && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.75 }}
                  >
                    Role: {session.role} · Status: {session.status}
                  </Typography>
                )}
                {session?.organisationName && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block' }}
                  >
                    Organisation: {session.organisationName}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>
        </AppCard>

        <AppCard>
          <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'action.hover',
                  color: 'primary.main',
                }}
              >
                <Sun size={22} strokeWidth={2} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Appearance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Light or dark (saved on this device)
                </Typography>
              </Box>
            </Stack>
            <FormControl
              component="fieldset"
              variant="standard"
              sx={{ width: '100%' }}
            >
              <FormLabel
                component="legend"
                sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}
              >
                Theme
              </FormLabel>
              <ToggleButtonGroup
                value={preference}
                exclusive
                onChange={handleAppearance}
                aria-label="Color mode"
                fullWidth
                sx={{
                  flexWrap: 'wrap',
                  gap: 1,
                  '& .MuiToggleButton-root': {
                    flex: '1 1 120px',
                    textTransform: 'none',
                    fontWeight: 600,
                    gap: 1,
                  },
                }}
              >
                <ToggleButton value="light" aria-label="Light mode">
                  <Sun size={18} />
                  Light
                </ToggleButton>
                <ToggleButton value="dark" aria-label="Dark mode">
                  <Moon size={18} />
                  Dark
                </ToggleButton>
              </ToggleButtonGroup>
            </FormControl>
          </Box>
        </AppCard>

        <AppCard>
          <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'action.hover',
                  color: 'primary.main',
                }}
              >
                <Shield size={22} strokeWidth={2} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Data & access
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tenant data stays scoped to your organisation
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Your access is limited to the data that belongs to{' '}
              {session?.organisationName || 'your organisation'}. Admin users
              can manage roles and review access requests under{' '}
              <em>Users → Pending requests</em>.
            </Typography>
          </Box>
        </AppCard>

        <Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Session
          </Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={signOut}
            sx={{ fontWeight: 600 }}
          >
            Sign out
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
