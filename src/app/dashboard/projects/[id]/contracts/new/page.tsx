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
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import AppCard from '@/components/ui/AppCard';
import PageHeader from '@/components/ui/PageHeader';
import { ApiError } from '@/lib/api-client';
import { toMinor } from '@/lib/money';
import { contractService } from '@/services/contractService';
import { authFetcher } from '@/lib/swr-fetcher';
import { keys } from '@/lib/swr-keys';
import { CONTRACT_STATUSES, type Project, type Subcontractor } from '@/types/construction';

type DraftMilestone = {
  name: string;
  percent: string;
  amountMajor: string;
  dueDate: string;
};

export default function NewContractPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;

  const { data: project } = useSWR<Project>(
    projectId ? keys.project(projectId) : null,
    authFetcher,
  );
  const { data: subbies } = useSWR<Subcontractor[]>(keys.subbies(), authFetcher);

  const [reference, setReference] = useState('');
  const [scope, setScope] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [subcontractorId, setSubcontractorId] = useState('');
  const [status, setStatus] = useState<(typeof CONTRACT_STATUSES)[number]>('Draft');
  const [originalMajor, setOriginalMajor] = useState('');
  const [retentionPercent, setRetentionPercent] = useState('5');
  const [signedAt, setSignedAt] = useState('');
  const [startDate, setStartDate] = useState('');
  const [plannedCompletionDate, setPlannedCompletionDate] = useState('');
  const [milestones, setMilestones] = useState<DraftMilestone[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = project?.budget.currency ?? 'AUD';

  useEffect(() => {
    if (project && project.departments.length && !departmentId) {
      setDepartmentId(project.departments[0]._id);
    }
  }, [project, departmentId]);

  const addMilestone = () => {
    const remainingPct = Math.max(
      0,
      100 -
        milestones.reduce((s, m) => s + (Number(m.percent) || 0), 0),
    );
    setMilestones((prev) => [
      ...prev,
      {
        name: `Milestone ${prev.length + 1}`,
        percent: String(remainingPct || 0),
        amountMajor: '',
        dueDate: '',
      },
    ]);
  };

  const updateMilestone = (idx: number, patch: Partial<DraftMilestone>) => {
    setMilestones((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)),
    );
  };

  const removeMilestone = (idx: number) =>
    setMilestones((prev) => prev.filter((_, i) => i !== idx));

  const submit = async () => {
    setError(null);
    if (!reference.trim() || !scope.trim() || !departmentId || !subcontractorId || !originalMajor) {
      setError('Reference, scope, department, subcontractor and value are required.');
      return;
    }
    setSubmitting(true);
    try {
      const c = await contractService.create(projectId, {
        projectId,
        departmentId,
        subcontractorId,
        reference: reference.trim(),
        scope: scope.trim(),
        status,
        originalValue: { amount: toMinor(originalMajor), currency },
        retentionPercent: Number(retentionPercent) || 0,
        signedAt: signedAt || null,
        startDate: startDate || null,
        plannedCompletionDate: plannedCompletionDate || null,
        paymentMilestones: milestones
          .filter((m) => m.name && m.percent && m.amountMajor)
          .map((m) => ({
            name: m.name,
            percentOfContract: Number(m.percent),
            amount: { amount: toMinor(m.amountMajor), currency },
            dueDate: m.dueDate || null,
          })),
      });
      router.push(`/dashboard/projects/${projectId}/contracts/${c._id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not create contract.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="New contract"
        description="Award a scope to a subcontractor with the value, retention rate, and progress payment milestones."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <AppCard>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Contract basics
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Reference"
                    required
                    placeholder="P-2025-001-ELEC"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Status"
                    value={status}
                    onChange={(e) =>
                      setStatus(
                        e.target.value as (typeof CONTRACT_STATUSES)[number],
                      )
                    }
                  >
                    {CONTRACT_STATUSES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    select
                    required
                    label="Department"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    helperText={
                      project && project.departments.length === 0
                        ? 'Add a department on the project first.'
                        : ''
                    }
                  >
                    {(project?.departments ?? []).map((d) => (
                      <MenuItem key={d._id} value={d._id}>
                        {d.name} ({d.type})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    select
                    required
                    label="Subcontractor"
                    value={subcontractorId}
                    onChange={(e) => setSubcontractorId(e.target.value)}
                  >
                    {(subbies ?? []).map((s) => (
                      <MenuItem key={s._id} value={s._id}>
                        {s.name}
                        {s.trade ? ` · ${s.trade}` : ''}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Scope of works"
                    required
                    multiline
                    minRows={3}
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Signed"
                    type="date"
                    value={signedAt}
                    onChange={(e) => setSignedAt(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Planned completion"
                    type="date"
                    value={plannedCompletionDate}
                    onChange={(e) => setPlannedCompletionDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
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
                  Payment milestones
                </Typography>
                <Button size="small" startIcon={<Plus size={14} />} onClick={addMilestone}>
                  Add milestone
                </Button>
              </Stack>
              {milestones.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Skip if you'll claim against scope only. Most progress contracts have 3–5
                  milestones tied to handover stages.
                </Typography>
              ) : (
                <Stack spacing={2} divider={<Divider flexItem />}>
                  {milestones.map((m, i) => (
                    <Grid container spacing={2} key={i} alignItems="center">
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          fullWidth
                          label="Name"
                          value={m.name}
                          onChange={(e) => updateMilestone(i, { name: e.target.value })}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 2 }}>
                        <TextField
                          fullWidth
                          label="% of contract"
                          type="number"
                          value={m.percent}
                          onChange={(e) => updateMilestone(i, { percent: e.target.value })}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField
                          fullWidth
                          label="Amount"
                          type="number"
                          value={m.amountMajor}
                          onChange={(e) => updateMilestone(i, { amountMajor: e.target.value })}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 9, sm: 2.5 }}>
                        <TextField
                          fullWidth
                          label="Due"
                          type="date"
                          value={m.dueDate}
                          onChange={(e) => updateMilestone(i, { dueDate: e.target.value })}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid size={{ xs: 3, sm: 0.5 }}>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => removeMilestone(i)}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                </Stack>
              )}
            </CardContent>
          </AppCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <AppCard sx={{ position: 'sticky', top: 16 }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Value & retention
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label={`Original value (${currency})`}
                  type="number"
                  required
                  value={originalMajor}
                  onChange={(e) => setOriginalMajor(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
                <TextField
                  fullWidth
                  label="Retention %"
                  type="number"
                  value={retentionPercent}
                  onChange={(e) => setRetentionPercent(e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  helperText="Standard is 5% (released 50% at PC, 50% after defects period)."
                />
              </Stack>
              <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  onClick={submit}
                  disabled={submitting}
                >
                  {submitting ? 'Creating…' : 'Create contract'}
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
