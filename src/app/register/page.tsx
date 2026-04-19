'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Container,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiHelper, REQUEST_TYPE, setAuthToken } from '@/lib/api-helper';

const baseFields = {
  userName: z.string().min(1, 'Required'),
  email: z.string().email(),
  password: z.string().min(8, 'At least 8 characters'),
};

const createOrgSchema = z.object({
  organisationName: z.string().min(1, 'Required'),
  ...baseFields,
});

const joinOrgSchema = z.object({
  tenantId: z
    .string()
    .min(1, 'Required')
    .regex(
      /^[a-z0-9-]+$/,
      'Lowercase letters, digits and dashes only',
    ),
  ...baseFields,
});

type CreateOrgValues = z.infer<typeof createOrgSchema>;
type JoinOrgValues = z.infer<typeof joinOrgSchema>;

/**
 * Translate the backend's error codes (see `AuthService.register`) into copy
 * the user can act on. Anything we don't recognise is shown as-is so we still
 * surface real failure reasons during development.
 */
function friendlyAuthError(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  switch (raw) {
    case "email_already_registered":
      return "An account with that email already exists. Try signing in instead.";
    case "organisation_not_found":
      return "No organisation matches that ID. Double-check it with your admin.";
    case "password_too_short":
      return "Password must be at least 8 characters.";
    case "email_required":
      return "Email is required.";
    case "user_name_required":
      return "Your name is required.";
    case "organisation_name_required":
      return "Organisation name is required.";
    case "tenant_id_required":
      return "Organisation ID is required.";
    case "invalid_mode":
      return "Something went wrong picking the registration mode. Reload and try again.";
    default:
      return raw;
  }
}

type AuthResponse = {
  failed?: boolean;
  error?: string;
  accessToken?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    role: string;
    status: 'PendingApproval' | 'Active' | 'Rejected';
    tenantId: string;
  };
};

export default function RegisterPage() {
  const [tab, setTab] = useState<'createOrg' | 'joinOrg'>('createOrg');

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Get started with Allatura
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Create a new organisation as its first admin, or request access to an
          existing organisation.
        </Typography>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v as 'createOrg' | 'joinOrg')}
          sx={{ mb: 2 }}
        >
          <Tab label="Create organisation" value="createOrg" />
          <Tab label="Join existing organisation" value="joinOrg" />
        </Tabs>

        {tab === 'createOrg' ? <CreateOrgForm /> : <JoinOrgForm />}

        <Typography variant="body2" sx={{ mt: 3 }}>
          Already have an account? <Link href="/login">Sign in</Link>
        </Typography>
      </Paper>
    </Container>
  );
}

function CreateOrgForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<CreateOrgValues>({ resolver: zodResolver(createOrgSchema) });

  const onSubmit = async (data: CreateOrgValues) => {
    const api = new ApiHelper('auth/register');
    api.includeKey = false;
    api.skipSessionHeaders = true;
    api.type = REQUEST_TYPE.POST;
    api.body = {
      mode: 'createOrg',
      organisationName: data.organisationName.trim(),
      userName: data.userName.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
    };
    const res = (await api.fetchRequest()) as AuthResponse;
    if (res?.failed || !res?.accessToken) {
      setFormError('root', {
        message: friendlyAuthError(res?.error, 'Registration failed'),
      });
      return;
    }
    setAuthToken(res.accessToken);
    // Active admins land directly in the dashboard.
    window.location.assign('/dashboard');
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <TextField
        label="Organisation name"
        fullWidth
        margin="normal"
        {...register('organisationName')}
        error={!!errors.organisationName}
        helperText={errors.organisationName?.message}
      />
      <TextField
        label="Your name"
        fullWidth
        margin="normal"
        {...register('userName')}
        error={!!errors.userName}
        helperText={errors.userName?.message}
      />
      <TextField
        label="Email"
        fullWidth
        margin="normal"
        autoComplete="email"
        {...register('email')}
        error={!!errors.email}
        helperText={errors.email?.message}
      />
      <TextField
        label="Password"
        type="password"
        fullWidth
        margin="normal"
        autoComplete="new-password"
        {...register('password')}
        error={!!errors.password}
        helperText={errors.password?.message}
      />
      {errors.root && (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          {errors.root.message}
        </Typography>
      )}
      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{ mt: 2 }}
        disabled={isSubmitting}
      >
        Create organisation
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        You will be the first admin and can invite other people from the dashboard.
      </Typography>
    </Box>
  );
}

function JoinOrgForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<JoinOrgValues>({ resolver: zodResolver(joinOrgSchema) });

  const onSubmit = async (data: JoinOrgValues) => {
    const api = new ApiHelper('auth/register');
    api.includeKey = false;
    api.skipSessionHeaders = true;
    api.type = REQUEST_TYPE.POST;
    api.body = {
      mode: 'joinOrg',
      tenantId: data.tenantId.trim().toLowerCase(),
      userName: data.userName.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
    };
    const res = (await api.fetchRequest()) as AuthResponse;
    if (res?.failed || !res?.accessToken) {
      setFormError('root', {
        message: friendlyAuthError(res?.error, 'Registration failed'),
      });
      return;
    }
    setAuthToken(res.accessToken);
    // Pending users hit the dashboard, where the layout-level gate routes
    // them to /dashboard/pending automatically.
    window.location.assign('/dashboard');
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <TextField
        label="Organisation ID"
        fullWidth
        margin="normal"
        placeholder="acme-corp"
        helperText={
          errors.tenantId?.message ||
          'The slug shared by your organisation admin.'
        }
        {...register('tenantId')}
        error={!!errors.tenantId}
      />
      <TextField
        label="Your name"
        fullWidth
        margin="normal"
        {...register('userName')}
        error={!!errors.userName}
        helperText={errors.userName?.message}
      />
      <TextField
        label="Email"
        fullWidth
        margin="normal"
        autoComplete="email"
        {...register('email')}
        error={!!errors.email}
        helperText={errors.email?.message}
      />
      <TextField
        label="Password"
        type="password"
        fullWidth
        margin="normal"
        autoComplete="new-password"
        {...register('password')}
        error={!!errors.password}
        helperText={errors.password?.message}
      />
      {errors.root && (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          {errors.root.message}
        </Typography>
      )}
      <Button
        type="submit"
        variant="contained"
        fullWidth
        sx={{ mt: 2 }}
        disabled={isSubmitting}
      >
        Request access
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        An admin must approve your account before you can use the dashboard.
      </Typography>
    </Box>
  );
}
