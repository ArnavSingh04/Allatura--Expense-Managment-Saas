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
import { ApiHelper, REQUEST_TYPE, setAuthToken } from '@/lib/api-helper';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Required'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    const api = new ApiHelper('auth/login');
    api.includeKey = false;
    api.type = REQUEST_TYPE.POST;
    api.body = { email: data.email, password: data.password };
    const res = (await api.fetchRequest()) as {
      failed?: boolean;
      accessToken?: string;
      error?: string;
    };
    if (res?.failed || !res?.accessToken) {
      setFormError('root', { message: 'Invalid email or password' });
      return;
    }
    setAuthToken(res.accessToken);
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Sign in to Plutus
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
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
            autoComplete="current-password"
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
            Sign in
          </Button>
          <Typography variant="body2" sx={{ mt: 2 }}>
            No account?{' '}
            <Link href="/register">Register</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
