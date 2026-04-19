'use client';

import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { Ban } from 'lucide-react';
import { useAuthSession } from '@/contexts/AuthSessionContext';

export default function RejectedScreen() {
  const { signOut, session } = useAuthSession();
  const orgLabel =
    session?.organisationName?.trim() ||
    (session?.tenantId ? `“${session.tenantId}”` : 'this organisation');

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={2.5} alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: (t) => t.palette.error.light,
              color: (t) => t.palette.error.contrastText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ban size={28} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Access denied
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your request to join <strong>{orgLabel}</strong> was rejected.
            Contact an administrator if you believe this was a mistake.
          </Typography>
          <Button variant="outlined" color="inherit" onClick={signOut}>
            Sign out
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
