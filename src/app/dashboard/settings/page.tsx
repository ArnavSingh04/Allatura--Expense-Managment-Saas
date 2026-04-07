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
import { Moon, Sun, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import AppCard from '@/components/ui/AppCard';
import { useColorMode, type ColorModePreference } from '@/lib/colorModeContext';
import { clearAuthToken, getStoredToken } from '@/lib/api-helper';
import { getJwtSubject } from '@/lib/jwt';
import { authFetcher } from '@/lib/swr-fetcher';
import { dashboardHeader } from '@/styles/MaterialStyles/shared/sharedStyles';

type MeResponse = {
  id?: string;
  email?: string;
  name?: string;
  nickname?: string;
  role?: string;
  found?: boolean;
};

function displayName(u: MeResponse | undefined): string {
  if (!u || u.found === false) {
    return '';
  }
  const n = (u.name || u.nickname || '').trim();
  if (n) {
    return n;
  }
  if (u.email) {
    return u.email.split('@')[0] ?? u.email;
  }
  return '';
}

function initials(u: MeResponse | undefined): string {
  const name = (u?.name || u?.nickname || '').trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const email = u?.email?.trim();
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '?';
}

export default function SettingsPage() {
  const router = useRouter();
  const { preference, setPreference } = useColorMode();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(getJwtSubject(getStoredToken()));
  }, []);

  const { data: me, error: profileError } = useSWR<MeResponse>(
    userId ? `users/id/${userId}` : null,
    authFetcher,
  );

  const greeting = useMemo(() => displayName(me), [me]);
  const avatarLetter = useMemo(() => initials(me), [me]);

  const logout = useCallback(() => {
    clearAuthToken();
    router.push('/login');
    router.refresh();
  }, [router]);

  const handleAppearance = (_: React.MouseEvent<HTMLElement>, value: ColorModePreference | null) => {
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
            <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
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
                {profileError || me?.found === false ? (
                  <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                    Could not load your profile. Try refreshing the page.
                  </Typography>
                ) : greeting ? (
                  <Typography variant="h6" sx={{ fontWeight: 600, mt: 0.5, letterSpacing: '-0.02em' }}>
                    {greeting}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {userId && me === undefined ? 'Loading your profile…' : 'Account identity in Plutus'}
                  </Typography>
                )}
                {me?.email && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {me.email}
                  </Typography>
                )}
                {me?.role && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                    Role: {me.role}
                  </Typography>
                )}
              </Box>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {greeting
                ? "You're signed in to the Plutus dashboard. Profile details reflect your account; changes may follow your organization's user management."
                : 'You are signed in to the dashboard. Name and email are managed by your organization and login provider.'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tip: use the avatar in the header to return here quickly.
            </Typography>
          </Box>
        </AppCard>

        <AppCard>
          <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
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
            <FormControl component="fieldset" variant="standard" sx={{ width: '100%' }}>
              <FormLabel component="legend" sx={{ mb: 1.5, fontWeight: 600, color: 'text.primary' }}>
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
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
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
                  Tenant data stays scoped to your organization
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Exports, retention, and admin policies can be added here as your deployment matures.
            </Typography>
          </Box>
        </AppCard>

        <Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Session
          </Typography>
          <Button variant="outlined" color="error" onClick={logout} sx={{ fontWeight: 600 }}>
            Sign out
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
