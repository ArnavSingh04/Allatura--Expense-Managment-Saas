'use client';

import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { clearAuthToken } from '@/lib/api-helper';
import { dashboardHeader } from '@/styles/MaterialStyles/shared/sharedStyles';

export default function SettingsPage() {
  const router = useRouter();

  const logout = () => {
    clearAuthToken();
    router.push('/login');
    router.refresh();
  };

  return (
    <Box>
      <Typography sx={dashboardHeader}>Settings</Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Session and preferences
      </Typography>
      <Button variant="outlined" color="error" onClick={logout}>
        Sign out
      </Button>
    </Box>
  );
}
