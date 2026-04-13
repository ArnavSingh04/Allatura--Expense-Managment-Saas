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
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
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

type ContractDoc = {
  _id: string;
  systemId?: { _id?: string } | string;
  costAmount: number;
  billingCycle: string;
  currency?: string;
  startDate: string;
  renewalDate: string;
  autoRenew: boolean;
  noticePeriodDays: number;
  expenseType: string;
};

function isoDate(d: string | Date) {
  const x = new Date(d);
  return x.toISOString().slice(0, 10);
}

function resolveSystemId(raw: ContractDoc['systemId']): string {
  if (raw == null) {
    return '';
  }
  if (typeof raw === 'string') {
    return raw;
  }
  if (typeof raw === 'object' && '_id' in raw && raw._id != null) {
    return String(raw._id);
  }
  return '';
}

const formDefaults: FormValues = {
  systemId: '',
  costAmount: 0.01,
  billingCycle: 'Annual',
  currency: 'USD',
  startDate: '',
  renewalDate: '',
  autoRenew: false,
  noticePeriodDays: 0,
  expenseType: 'Recurring',
};

export default function EditContractPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: doc, isLoading } = useSWR<ContractDoc>(
    id ? `contracts/${id}` : null,
    authFetcher,
  );
  const { data: systems } = useSWR<Sys[]>('systems', authFetcher);

  const { register, handleSubmit, control, reset, formState: { isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: formDefaults,
    });

  useEffect(() => {
    if (!doc) {
      return;
    }
    const sid = resolveSystemId(doc.systemId);
    reset({
      systemId: sid,
      costAmount: doc.costAmount,
      billingCycle: doc.billingCycle as FormValues['billingCycle'],
      currency: doc.currency || 'USD',
      startDate: isoDate(doc.startDate),
      renewalDate: isoDate(doc.renewalDate),
      autoRenew: doc.autoRenew,
      noticePeriodDays: doc.noticePeriodDays,
      expenseType: doc.expenseType as FormValues['expenseType'],
    });
  }, [doc, reset]);

  const onSubmit = async (data: FormValues) => {
    const api = new ApiHelper(`contracts/${id}`);
    api.includeKey = false;
    api.type = REQUEST_TYPE.PATCH;
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
    const res = (await api.fetchRequest()) as { failed?: boolean };
    if (res?.failed) {
      return;
    }
    router.push(`/dashboard/contracts/${id}`);
  };

  if (isLoading || !doc) {
    return <Typography>Loading…</Typography>;
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 480 }}>
      <Typography sx={dashboardHeader}>Edit contract</Typography>
      <Controller
        name="systemId"
        control={control}
        render={({ field }) => {
          const list = Array.isArray(systems) ? systems : [];
          const sid = field.value ?? '';
          const inList = list.some((s) => s.id === sid);
          return (
            <FormControl fullWidth margin="normal">
              <InputLabel>System</InputLabel>
              <Select
                label="System"
                displayEmpty
                name={field.name}
                onBlur={field.onBlur}
                inputRef={field.ref}
                value={sid}
                onChange={field.onChange}
              >
                <MenuItem value="" disabled>
                  <em>{list.length ? 'Choose a system' : 'No systems in list'}</em>
                </MenuItem>
                {!inList && sid ? (
                  <MenuItem value={sid} disabled>
                    <em>Current system (not in list)</em>
                  </MenuItem>
                ) : null}
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
            <Select
              label="Billing cycle"
              name={field.name}
              onBlur={field.onBlur}
              inputRef={field.ref}
              value={field.value ?? 'Annual'}
              onChange={field.onChange}
            >
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
            <Select
              label="Expense type"
              name={field.name}
              onBlur={field.onBlur}
              inputRef={field.ref}
              value={field.value ?? 'Recurring'}
              onChange={field.onChange}
            >
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
