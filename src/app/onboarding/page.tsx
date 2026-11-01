'use client';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import {
  invitationService,
  submitOnboarding,
  type InviteLookup,
} from '@/services/invitationService';
import { ApiError } from '@/lib/api-client';
import { ROLE_LABEL, normalizeRole } from '@/lib/rbac';
import { useUser } from '@auth0/nextjs-auth0';
import { activateOrganisation } from '@/services/organisationService';
import { invitationEmailMismatch } from '@/lib/invitation-account-switch';
import InvitationAccountNotice from '@/components/auth/InvitationAccountNotice';

function friendlyError(err: unknown): string {
  const raw = err instanceof ApiError ? err.message : String(err);
  switch (raw) {
    case 'email_claim_missing':
      return 'We could not read your email from the sign-in. Ask the administrator to enable the Auth0 email claim.';
    case 'email_not_verified':
      return 'Please verify your email address with the sign-in provider first, then try again.';
    case 'invite_email_mismatch':
      return 'This invitation was sent to a different email address than the one you signed in with.';
    case 'invite_expired':
      return 'This invitation has expired. Ask your administrator to resend it.';
    case 'invite_revoked':
      return 'This invitation has been revoked.';
    case 'invite_accepted':
      return 'This invitation has already been used.';
    case 'email_already_registered':
      return 'An account already exists for your email.';
    case 'organisation_name_required':
      return 'Please enter an organisation name.';
    case 'name_required':
      return 'Please enter your name.';
    default:
      return raw || 'Something went wrong. Please try again.';
  }
}

function OnboardingContent({ inviteToken }: { inviteToken?: string }) {
  const { ready, isAuthenticated, session } = useAuthSession();
  const { user } = useUser();

  const [name, setName] = useState('');
  const [organisationName, setOrganisationName] = useState('');
  const [lookup, setLookup] = useState<InviteLookup | null>(null);
  const [lookupLoading, setLookupLoading] = useState(!!inviteToken);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [joinedOrganisationId, setJoinedOrganisationId] = useState<string | null>(null);
  const currentEmail = session?.email || user?.email || '';
  const wrongEmail = !!(lookup?.valid && invitationEmailMismatch(lookup.email, currentEmail));

  // Ensure the visitor is authenticated; otherwise send them through Auth0 and
  // return them right back here (preserving ?invite=...).
  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      const returnTo = window.location.pathname + window.location.search;
      window.location.assign(
        `/auth/login?returnTo=${encodeURIComponent(returnTo)}`,
      );
      return;
    }
    if (session && !inviteToken) {
      // Already onboarded — nothing to do here.
      window.location.assign('/dashboard');
    }
  }, [ready, isAuthenticated, session, inviteToken]);

  // Resolve invitation details for display.
  useEffect(() => {
    if (!inviteToken) return;
    let cancelled = false;
    invitationService
      .lookup(inviteToken)
      .then((res) => {
        if (!cancelled) setLookup(res);
      })
      .catch(() => {
        if (!cancelled) setLookup({ valid: false, reason: 'not_found' });
      })
      .finally(() => {
        if (!cancelled) setLookupLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    if (!joinedOrganisationId && wrongEmail) {
      setError('Sign in with the invited email before joining this organisation.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!inviteToken && !organisationName.trim()) {
      setError('Please enter an organisation name.');
      return;
    }
    setSubmitting(true);
    try {
      let organisationId = joinedOrganisationId;
      if (!organisationId) {
        const result = await submitOnboarding({
          name: name.trim(),
          inviteToken,
          organisationName: inviteToken ? undefined : organisationName.trim(),
        });
        organisationId = result.organisationId ?? null;
        setJoinedOrganisationId(organisationId);
      }
      if (organisationId) {
        try {
          await activateOrganisation(organisationId);
        } catch {
          setError('Your membership is saved. Select Open organisation to try opening it again.');
          setSubmitting(false);
          return;
        }
      }
      // Full reload so the session/profile is re-fetched from scratch.
      window.location.assign('/dashboard');
    } catch (err) {
      setError(friendlyError(err));
      setSubmitting(false);
    }
  };

  if (!ready || !isAuthenticated || (session && !inviteToken)) {
    return (
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  const inviteInvalid =
    inviteToken && lookup && lookup.valid === false ? lookup.reason : null;

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          {inviteToken ? 'Accept your invitation' : 'Set up your organisation'}
        </Typography>

        {currentEmail && <Typography variant="body2">Signed in as {currentEmail}</Typography>}
        {inviteToken && lookup?.valid && !joinedOrganisationId && (
          <InvitationAccountNotice invitedEmail={lookup.email} currentEmail={currentEmail} token={inviteToken} />
        )}

        {inviteToken ? (
          lookupLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={22} />
            </Box>
          ) : lookup && lookup.valid ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                You&apos;ve been invited to{' '}
                <strong>{lookup.organisationName}</strong> as{' '}
                <Chip
                  size="small"
                  label={ROLE_LABEL[normalizeRole(lookup.role)]}
                  sx={{ ml: 0.5 }}
                />
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Invitation for {lookup.email}
              </Typography>
            </Box>
          ) : (
            <Alert severity="error" sx={{ mb: 2 }}>
              This invitation link is {inviteInvalid ?? 'invalid'}. Ask your
              administrator to send a new one.
            </Alert>
          )
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You&apos;ll be the first admin and can invite your team from the
            dashboard.
          </Typography>
        )}

        {(!inviteToken || (lookup && lookup.valid)) && (
          <Box component="form" onSubmit={onSubmit}>
            <TextField
              label="Your name"
              fullWidth
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            {!inviteToken && (
              <TextField
                label="Organisation name"
                fullWidth
                margin="normal"
                value={organisationName}
                onChange={(e) => setOrganisationName(e.target.value)}
              />
            )}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              disabled={submitting || (!joinedOrganisationId && wrongEmail)}
            >
              {joinedOrganisationId ? 'Open organisation' : inviteToken ? 'Join organisation' : 'Create organisation'}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

function OnboardingInner() {
  const search = useSearchParams();
  const inviteToken = search.get('invite') ?? undefined;
  // A changed invite gets fresh lookup/form state before its request begins.
  return <OnboardingContent key={inviteToken ?? 'new-organisation'} inviteToken={inviteToken} />;
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingInner />
    </Suspense>
  );
}
