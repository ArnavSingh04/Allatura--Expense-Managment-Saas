'use client';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  invitationService,
  type InviteLookup,
} from '@/services/invitationService';
import { ROLE_LABEL, normalizeRole } from '@/lib/rbac';

/**
 * Public landing page for an invitation magic link. Shows who invited the user
 * and to which org/role, then hands off to /onboarding (which enforces Auth0
 * sign-in and collects the user's name before accepting the invite).
 */
export default function InviteLandingPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';
  const router = useRouter();
  const [lookup, setLookup] = useState<InviteLookup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    invitationService
      .lookup(token)
      .then((res) => !cancelled && setLookup(res))
      .catch(() => !cancelled && setLookup({ valid: false, reason: 'not_found' }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Organisation invitation
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={26} />
          </Box>
        ) : lookup && lookup.valid ? (
          <>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {lookup.invitedByName || 'An administrator'} has invited you to
              join <strong>{lookup.organisationName}</strong>.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Chip label={ROLE_LABEL[normalizeRole(lookup.role)]} />
              <Typography variant="caption" color="text.secondary">
                {lookup.email}
              </Typography>
            </Box>
            <Button
              variant="contained"
              fullWidth
              onClick={() =>
                router.push(`/onboarding?invite=${encodeURIComponent(token)}`)
              }
            >
              Accept &amp; continue
            </Button>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 2 }}
            >
              You&apos;ll sign in securely and confirm your details on the next
              step.
            </Typography>
          </>
        ) : (
          <Alert severity="error">
            This invitation link is{' '}
            {lookup && lookup.valid === false ? lookup.reason : 'invalid'}. Ask
            your administrator to send a new one.
          </Alert>
        )}
      </Paper>
    </Container>
  );
}
