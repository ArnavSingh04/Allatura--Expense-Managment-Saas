'use client';

import { Box, Button, Typography } from '@mui/material';
import Link from 'next/link';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import type { RbacAction } from '@/lib/rbac';

type RoleGateProps = {
  action: RbacAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function RoleGate({ action, children, fallback }: RoleGateProps) {
  const { can, ready } = useAuthSession();
  if (!ready) {
    return null;
  }
  if (!can(action)) {
    return fallback ?? <ForbiddenPanel />;
  }
  return <>{children}</>;
}

export function ForbiddenPanel() {
  return (
    <Box
      sx={{
        py: 6,
        px: 2,
        textAlign: 'center',
        maxWidth: 480,
        mx: 'auto',
      }}
    >
      <Typography variant="h6" gutterBottom>
        Access restricted
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Your role does not allow this action. Ask an administrator if you need access.
      </Typography>
      <Button component={Link} href="/dashboard" variant="contained">
        Back to dashboard
      </Button>
    </Box>
  );
}
