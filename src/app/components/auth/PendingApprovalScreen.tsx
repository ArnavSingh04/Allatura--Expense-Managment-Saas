'use client';

import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { Clock } from 'lucide-react';
import { useAuthSession } from '@/contexts/AuthSessionContext';

/**
 * Shown to authenticated users whose account has `status = PendingApproval`.
 * Polls /auth/me automatically (handled inside AuthSessionContext) and the
 * dashboard layout will swap this for the actual app once `isActive`.
 */
export default function PendingApprovalScreen() {
  const { session, signOut } = useAuthSession();
  const orgLabel =
    session?.organisationName?.trim() ||
    (session?.tenantId ? `“${session.tenantId}”` : 'your organisation');

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={2.5} alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: (t) => t.palette.warning.light,
              color: (t) => t.palette.warning.contrastText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={28} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Waiting for approval
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your access request to <strong>{orgLabel}</strong> is awaiting an
            administrator. You'll get full access here as soon as they approve.
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
            <CircularProgress size={14} />
            <Typography variant="caption">
              Checking status automatically
            </Typography>
          </Stack>
          <Button variant="outlined" color="inherit" onClick={signOut}>
            Sign out
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
