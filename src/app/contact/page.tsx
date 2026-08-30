'use client';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { useState } from 'react';
import { submitContact } from '@/services/contactService';
import { ApiError } from '@/lib/api-client';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function friendlyError(err: unknown): string {
  const raw = err instanceof ApiError ? err.message : String(err);
  switch (raw) {
    case 'invalid_name':
      return 'Please enter your name.';
    case 'invalid_email':
      return 'Please enter a valid email address.';
    case 'invalid_message':
      return 'Please enter a message (at least 10 characters).';
    case 'rate_limited':
      return "You've sent a few messages already — please try again in a little while.";
    default:
      return raw || 'Something went wrong sending your message. Please try again.';
  }
}

export default function ContactPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  // Honeypot — must stay empty.
  const [companyWebsite, setCompanyWebsite] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Please enter a message (at least 10 characters).');
      return;
    }
    setSubmitting(true);
    try {
      await submitContact({
        name: name.trim(),
        email: email.trim(),
        company: company.trim() || undefined,
        subject: subject.trim() || undefined,
        message: message.trim(),
        company_website: companyWebsite,
      });
      setSent(true);
    } catch (err) {
      setError(friendlyError(err));
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        backgroundImage: isDark
          ? 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(45, 212, 191, 0.12), transparent)'
          : 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(13, 148, 136, 0.15), transparent)',
      }}
    >
      <Box
        component="header"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 4 },
          py: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: (th) => alpha(th.palette.background.paper, isDark ? 0.75 : 0.7),
          backdropFilter: 'blur(12px)',
        }}
      >
        <Typography
          component={Link}
          href="/"
          className="customfont"
          sx={{ fontSize: '1.125rem', color: 'text.primary', textDecoration: 'none' }}
        >
          ALLATURA
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button component={Link} href="/login" color="inherit" sx={{ fontWeight: 600 }}>
            Sign in
          </Button>
          <Button component={Link} href="/register" variant="contained" sx={{ fontWeight: 600 }}>
            Get started
          </Button>
        </Box>
      </Box>

      <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, letterSpacing: '-0.03em', mb: 1 }}
        >
          Contact us
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Questions about Allatura, pricing, or a demo? Send us a message and
          we&apos;ll get back to you.
        </Typography>

        <Paper sx={{ p: { xs: 3, md: 4 } }}>
          {sent ? (
            <Alert severity="success">
              Thanks for reaching out — we&apos;ve received your message and will
              be in touch shortly.
            </Alert>
          ) : (
            <Box component="form" onSubmit={onSubmit} noValidate>
              {/* Honeypot: hidden from users; bots tend to fill it. */}
              <Box
                aria-hidden="true"
                sx={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
              >
                <TextField
                  label="Company website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                />
              </Box>

              <TextField
                label="Your name"
                fullWidth
                required
                margin="normal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label="Company (optional)"
                fullWidth
                margin="normal"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
              <TextField
                label="Subject (optional)"
                fullWidth
                margin="normal"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <TextField
                label="Message"
                fullWidth
                required
                multiline
                minRows={4}
                margin="normal"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 3, py: 1.25, fontWeight: 600 }}
                disabled={submitting}
                startIcon={
                  submitting ? <CircularProgress size={18} color="inherit" /> : undefined
                }
              >
                {submitting ? 'Sending…' : 'Send message'}
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
