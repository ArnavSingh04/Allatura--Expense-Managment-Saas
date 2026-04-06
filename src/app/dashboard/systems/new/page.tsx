'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import useSWR from 'swr';
import { z } from 'zod';
import { ApiHelper, REQUEST_TYPE } from '@/lib/api-helper';
import { authFetcher } from '@/lib/swr-fetcher';
import { dashboardHeader } from '@/styles/MaterialStyles/shared/sharedStyles';

const schema = z.object({
  name: z.string().min(1),
  vendor: z.string().optional(),
  category: z.enum(['SaaS', 'Infrastructure', 'Internal Tool']),
  department: z.string().optional(),
  businessOwner: z.string().optional(),
  technicalOwner: z.string().optional(),
  criticality: z.enum(['Low', 'Medium', 'High']),
});

type FormValues = z.infer<typeof schema>;

type UserOpt = { id: string; name?: string; email?: string };

export default function NewSystemPage() {
  const router = useRouter();
  const { data: users } = useSWR<UserOpt[]>('users', authFetcher);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'SaaS',
      criticality: 'Medium',
    },
  });

  const onSubmit = async (data: FormValues) => {
    const api = new ApiHelper('systems');
    api.includeKey = false;
    api.type = REQUEST_TYPE.POST;
    api.body = {
      name: data.name,
      vendor: data.vendor || '',
      category: data.category,
      department: data.department || '',
      businessOwner: data.businessOwner || null,
      technicalOwner: data.technicalOwner || null,
      criticality: data.criticality,
    };
    const res = (await api.fetchRequest()) as { failed?: boolean; id?: string };
    if (res?.failed || !res?.id) {
      return;
    }
    router.push(`/dashboard/systems/${res.id}`);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 480 }}>
      <Typography sx={dashboardHeader}>Add system</Typography>
      <TextField label="Name" fullWidth margin="normal" {...register('name')} error={!!errors.name} />
      <TextField label="Vendor" fullWidth margin="normal" {...register('vendor')} />
      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select label="Category" {...field}>
              <MenuItem value="SaaS">SaaS</MenuItem>
              <MenuItem value="Infrastructure">Infrastructure</MenuItem>
              <MenuItem value="Internal Tool">Internal Tool</MenuItem>
            </Select>
          </FormControl>
        )}
      />
      <TextField label="Department" fullWidth margin="normal" {...register('department')} />
      <Controller
        name="businessOwner"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth margin="normal">
            <InputLabel>Business owner</InputLabel>
            <Select label="Business owner" {...field} value={field.value ?? ''}>
              <MenuItem value="">None</MenuItem>
              {(users ?? []).map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name || u.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      />
      <Controller
        name="technicalOwner"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth margin="normal">
            <InputLabel>Technical owner</InputLabel>
            <Select label="Technical owner" {...field} value={field.value ?? ''}>
              <MenuItem value="">None</MenuItem>
              {(users ?? []).map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name || u.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      />
      <Controller
        name="criticality"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth margin="normal">
            <InputLabel>Criticality</InputLabel>
            <Select label="Criticality" {...field}>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </Select>
          </FormControl>
        )}
      />
      <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={isSubmitting}>
        Save
      </Button>
    </Box>
  );
}
