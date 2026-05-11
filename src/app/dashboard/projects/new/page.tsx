'use client';

import {
  Alert,
  Box,
  Button,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AppCard from '@/components/ui/AppCard';
import PageHeader from '@/components/ui/PageHeader';
import { ApiError } from '@/lib/api-client';
import { toMinor } from '@/lib/money';
import { projectService } from '@/services/projectService';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { DEPARTMENT_TYPES, PROJECT_STATUSES } from '@/types/construction';

type DraftDept = {
  type: string;
  name: string;
  budgetMajor: string;
  costCode: string;
};

const today = new Date().toISOString().slice(0, 10);
const inSixMonths = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180)
  .toISOString()
  .slice(0, 10);

export default function NewProjectPage() {
  const router = useRouter();
  const { session } = useAuthSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [status, setStatus] = useState<(typeof PROJECT_STATUSES)[number]>('Planning');
  const [startDate, setStartDate] = useState(today);
  const [plannedEndDate, setPlannedEndDate] = useState(inSixMonths);
  const [budgetMajor, setBudgetMajor] = useState('');
  const [contingencyMajor, setContingencyMajor] = useState('');
  const [currency, setCurrency] = useState('AUD');
  const [pmId, setPmId] = useState(session?.sub ?? '');
  const [departments, setDepartments] = useState<DraftDept[]>([
    { type: 'Sitework', name: 'Sitework', budgetMajor: '', costCode: '' },
  ]);

  const updateDept = (idx: number, patch: Partial<DraftDept>) => {
    setDepartments((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
    );
  };

  const addDept = () =>
    setDepartments((prev) => [
      ...prev,
      { type: 'Other', name: '', budgetMajor: '', costCode: '' },
    ]);

  const removeDept = (idx: number) =>
    setDepartments((prev) => prev.filter((_, i) => i !== idx));

  const submit = async () => {
    setError(null);
    if (!code.trim() || !name.trim() || !budgetMajor || !pmId.trim()) {
      setError('Code, name, budget and project manager are required.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await projectService.create({
        code: code.trim(),
        name: name.trim(),
        client: client.trim() || undefined,
        siteAddress: siteAddress.trim() || undefined,
        status,
        startDate,
        plannedEndDate,
        budget: { amount: toMinor(budgetMajor), currency },
        contingency: contingencyMajor
          ? { amount: toMinor(contingencyMajor), currency }
          : undefined,
        projectManagerId: pmId.trim(),
        departments: departments
          .filter((d) => d.name.trim() && d.budgetMajor)
          .map((d) => ({
            type: d.type,
            name: d.name.trim(),
            budget: { amount: toMinor(d.budgetMajor), currency },
            costCode: d.costCode.trim() || undefined,
          })),
      });
      router.push(`/dashboard/projects/${created._id}`);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : 'Could not create project.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="New project"
        description="Define the job, the budget, and the departments you'll track separately."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <AppCard>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Project basics
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Code"
                    fullWidth
                    required
                    placeholder="P-2025-001"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    label="Project name"
                    fullWidth
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Client"
                    fullWidth
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Site address"
                    fullWidth
                    value={siteAddress}
                    onChange={(e) => setSiteAddress(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Status"
                    fullWidth
                    select
                    value={status}
                    onChange={(e) =>
                      setStatus(
                        e.target.value as (typeof PROJECT_STATUSES)[number],
                      )
                    }
                  >
                    {PROJECT_STATUSES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Start date"
                    type="date"
                    fullWidth
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Planned end date"
                    type="date"
                    fullWidth
                    value={plannedEndDate}
                    onChange={(e) => setPlannedEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Project manager (User ID)"
                    fullWidth
                    required
                    value={pmId}
                    onChange={(e) => setPmId(e.target.value)}
                    helperText="Default: signed-in user. Replace with the PM's user ID if different."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </AppCard>

          <AppCard sx={{ mt: 2.5 }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Departments
                </Typography>
                <Button
                  size="small"
                  startIcon={<Plus size={14} />}
                  onClick={addDept}
                >
                  Add department
                </Button>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Carve the budget into trades. You can add more later.
              </Typography>
              <Stack spacing={2} divider={<Divider flexItem />}>
                {departments.map((d, i) => (
                  <Grid container spacing={2} key={i} alignItems="center">
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        select
                        fullWidth
                        label="Trade"
                        value={d.type}
                        onChange={(e) => updateDept(i, { type: e.target.value })}
                      >
                        {DEPARTMENT_TYPES.map((t) => (
                          <MenuItem key={t} value={t}>
                            {t}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="Department name"
                        value={d.name}
                        onChange={(e) => updateDept(i, { name: e.target.value })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        label="Budget"
                        type="number"
                        value={d.budgetMajor}
                        onChange={(e) =>
                          updateDept(i, { budgetMajor: e.target.value })
                        }
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">$</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 9, sm: 1.5 }}>
                      <TextField
                        fullWidth
                        label="Cost code"
                        value={d.costCode}
                        onChange={(e) =>
                          updateDept(i, { costCode: e.target.value })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 3, sm: 0.5 }}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeDept(i)}
                        disabled={departments.length === 1}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
              </Stack>
            </CardContent>
          </AppCard>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <AppCard sx={{ position: 'sticky', top: 16 }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Budget
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Project budget"
                  type="number"
                  required
                  value={budgetMajor}
                  onChange={(e) => setBudgetMajor(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Contingency"
                  type="number"
                  helperText="Optional reserve outside the trade budgets."
                  value={contingencyMajor}
                  onChange={(e) => setContingencyMajor(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Currency"
                  value={currency}
                  onChange={(e) =>
                    setCurrency(e.target.value.toUpperCase().slice(0, 3))
                  }
                />
              </Stack>
              <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={submit}
                  disabled={submitting}
                  fullWidth
                >
                  {submitting ? 'Creating…' : 'Create project'}
                </Button>
                <Button
                  size="large"
                  variant="outlined"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </Stack>
            </CardContent>
          </AppCard>
        </Grid>
      </Grid>
    </Box>
  );
}
