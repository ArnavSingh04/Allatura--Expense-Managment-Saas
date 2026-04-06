'use client';

import { Box } from '@mui/material';
import { useCallback, useState } from 'react';
import AppSidebar from '@/components/dashboard/AppSidebar';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import { plutus } from '@/theme/tokens';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenu = useCallback(() => setMobileOpen(true), []);
  const handleMobileClose = useCallback(() => setMobileOpen(false), []);

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <AppSidebar mobileOpen={mobileOpen} onMobileClose={handleMobileClose} />

      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <DashboardTopbar onMenuClick={handleMenu} />
        <Box
          sx={{
            flex: 1,
            px: plutus.space.pageX,
            py: plutus.space.pageY,
            maxWidth: 1320,
            width: '100%',
            mx: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
