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
import { Controller, useForm } from 'react-hook-form';
import useSWR from 'swr';
import { z } from 'zod';
import { ApiHelper, REQUEST_TYPE } from '@/lib/api-helper';
import { authFetcher } from '@/lib/swr-fetcher';
import { dashboardHeader } from '@/styles/MaterialStyles/shared/sharedStyles';

const schema = z.object({
  systemId: z.string().min(1),
  costAmount: z.coerce.number().positive(),
  billingCycle: z.enum(['Monthly', 'Annual', 'Custom']),
  currency: z.string().optional(),
  startDate: z.string().min(1),
  renewalDate: z.string().min(1),
  autoRenew: z.boolean().optional(),
  noticePeriodDays: z.coerce.number().min(0).optional(),
  expenseType: z.enum(['Recurring', 'One-time']),
});

type FormValues = z.infer<typeof schema>;

type Sys = { id: string; name: string };

export default function NewContractPage() {
  const router = useRouter();
  const { data: systems } = useSWR<Sys[]>('systems', authFetcher);
  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      systemId: '',
      billingCycle: 'Annual',
      currency: 'USD',
      expenseType: 'Recurring',
      autoRenew: false,
      noticePeriodDays: 0,
    },
  });

  const onSubmit = async (data: FormValues) => {
    const api = new ApiHelper('contracts');
    api.includeKey = false;
    api.type = REQUEST_TYPE.POST;
    api.body = {
      systemId: data.systemId,
      costAmount: data.costAmount,
      billingCycle: data.billingCycle,
      currency: data.currency || 'USD',
      startDate: data.startDate,
      renewalDate: data.renewalDate,
      autoRenew: data.autoRenew ?? false,
      noticePeriodDays: data.noticePeriodDays ?? 0,
      expenseType: data.expenseType,
    };
    const res = (await api.fetchRequest()) as { failed?: boolean; id?: string };
    if (res?.failed || !res?.id) {
      return;
    }
    router.push(`/dashboard/contracts/${res.id}`);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 480 }}>
      <Typography sx={dashboardHeader}>Add contract</Typography>
      <Controller
        name="systemId"
        control={control}
        render={({ field }) => {
          const list = Array.isArray(systems) ? systems : [];
          const emptySystems = list.length === 0;
          return (
            <FormControl fullWidth margin="normal">
              <InputLabel>System</InputLabel>
              <Select
                label="System"
                displayEmpty
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                inputRef={field.ref}
              >
                <MenuItem value="" disabled>
                  <em>
                    {emptySystems
                      ? 'No systems available — add one under Systems first'
                      : 'Choose a system'}
                  </em>
                </MenuItem>
                {list.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        }}
      />
      <TextField
        label="Cost amount"
        type="number"
        fullWidth
        margin="normal"
        inputProps={{ step: '0.01', min: 0 }}
        {...register('costAmount')}
      />
      <Controller
        name="billingCycle"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth margin="normal">
            <InputLabel>Billing cycle</InputLabel>
            <Select label="Billing cycle" {...field}>
              <MenuItem value="Monthly">Monthly</MenuItem>
              <MenuItem value="Annual">Annual</MenuItem>
              <MenuItem value="Custom">Custom</MenuItem>
            </Select>
          </FormControl>
        )}
      />
      <TextField label="Currency" fullWidth margin="normal" {...register('currency')} />
      <TextField
        label="Start date"
        type="date"
        fullWidth
        margin="normal"
        InputLabelProps={{ shrink: true }}
        {...register('startDate')}
      />
      <TextField
        label="Renewal date"
        type="date"
        fullWidth
        margin="normal"
        InputLabelProps={{ shrink: true }}
        {...register('renewalDate')}
      />
      <Controller
        name="expenseType"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth margin="normal">
            <InputLabel>Expense type</InputLabel>
            <Select label="Expense type" {...field}>
              <MenuItem value="Recurring">Recurring</MenuItem>
              <MenuItem value="One-time">One-time</MenuItem>
            </Select>
          </FormControl>
        )}
      />
      <TextField
        label="Notice period (days)"
        type="number"
        fullWidth
        margin="normal"
        {...register('noticePeriodDays')}
      />
      <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={isSubmitting}>
        Save
      </Button>
    </Box>
  );
}
