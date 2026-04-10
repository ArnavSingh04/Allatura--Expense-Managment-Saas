'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiHelper, REQUEST_TYPE } from '@/lib/api-helper';

const schema = z.object({
  organisationName: z.string().min(1, 'Required'),
  userName: z.string().min(1, 'Required'),
  email: z.string().email(),
  password: z.string().min(8, 'At least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    const api = new ApiHelper('auth/register');
    api.includeKey = false;
    api.skipSessionHeaders = true;
    api.type = REQUEST_TYPE.POST;
    api.body = {
      organisationName: data.organisationName,
      userName: data.userName,
      email: data.email,
      password: data.password,
    };
    const res = (await api.fetchRequest()) as {
      failed?: boolean;
      message?: string;
      error?: string;
    };
    if (res?.failed) {
      setFormError('root', {
        message: res.error || 'Registration failed',
      });
      return;
    }
    router.push('/login');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Create organisation
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
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
            Register
          </Button>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Already have an account? <Link href="/login">Sign in</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
