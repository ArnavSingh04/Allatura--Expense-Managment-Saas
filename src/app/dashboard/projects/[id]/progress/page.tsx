'use client';

import {
  Alert,
  Box,
  Button,
  CardContent,
  IconButton,
  LinearProgress,
  MenuItem,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { CheckCircle2, Flag, Plus, Save, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR, { mutate } from 'swr';
import AppCard from '@/components/ui/AppCard';
import EmptyState from '@/components/ui/EmptyState';
import StatusChip from '@/components/construction/StatusChip';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { ApiError } from '@/lib/api-client';
import { authFetcher } from '@/lib/swr-fetcher';
import { keys } from '@/lib/swr-keys';
import { progressService } from '@/services/progressService';
import type { Milestone, ProgressUpdate, Project } from '@/types/construction';

export default function ProjectProgressPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { can } = useAuthSession();

  const { data: project } = useSWR<Project>(
    id ? keys.project(id) : null,
    authFetcher,
  );
  const { data: updates } = useSWR<ProgressUpdate[]>(
    id ? keys.progressByProject(id) : null,
    authFetcher,
  );
  const { data: milestones } = useSWR<Milestone[]>(
    id ? keys.milestonesByProject(id) : null,
    authFetcher,
  );

  const refresh = () =>
    void Promise.all([
      mutate(keys.project(id)),
      mutate(keys.progressByProject(id)),
      mutate(keys.milestonesByProject(id)),
      mutate(keys.projectDashboard(id)),
    ]);

  if (!project) return <LinearProgress />;

  return (
    <Stack spacing={2.5}>
      <DepartmentProgressEditor
        project={project}
        canEdit={can('progress.edit')}
        onSaved={refresh}
      />
      <RecentUpdates updates={updates ?? []} departments={project.departments} />
      <MilestonesPanel
        projectId={id}
        milestones={milestones ?? []}
        departments={project.departments}
        canEdit={can('progress.edit')}
        onChanged={refresh}
      />
    </Stack>
  );
}

function DepartmentProgressEditor({
  project,
  canEdit,
  onSaved,
}: {
  project: Project;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { pct: number; note: string }>>(
    {},
  );

  useEffect(() => {
    const initial: Record<string, { pct: number; note: string }> = {};
    project.departments.forEach((d) => {
      initial[d._id] = { pct: d.percentComplete, note: '' };
    });
    setDrafts(initial);
  }, [project]);

  const save = async (departmentId: string) => {
    setError(null);
    setBusy(departmentId);
    try {
      await progressService.add(project._id, {
        departmentId,
        percentComplete: drafts[departmentId]?.pct ?? 0,
        note: drafts[departmentId]?.note?.trim() || undefined,
      });
      setDrafts((prev) => ({
        ...prev,
        [departmentId]: { ...prev[departmentId], note: '' },
      }));
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save progress.');
    } finally {
      setBusy(null);
    }
  };

  if (project.departments.length === 0) {
    return (
      <EmptyState
        icon={Flag}
        title="No departments configured"
        description="Add departments on the project to start tracking progress."
      />
    );
  }

  return (
    <AppCard>
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          Department progress
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Stack spacing={2}>
          {project.departments.map((d) => {
            const draft = drafts[d._id] ?? { pct: d.percentComplete, note: '' };
            const isDirty =
              draft.pct !== d.percentComplete || draft.note.trim().length > 0;
            return (
              <Box key={d._id}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={2}
                  alignItems={{ md: 'center' }}
                >
                  <Box sx={{ minWidth: 200 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {d.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {d.type}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Slider
                      value={draft.pct}
                      min={0}
                      max={100}
                      step={5}
                      marks={[
                        { value: 0, label: '0%' },
                        { value: 50, label: '50%' },
                        { value: 100, label: '100%' },
                      ]}
                      valueLabelDisplay="auto"
                      onChange={(_, val) =>
                        setDrafts((p) => ({
                          ...p,
                          [d._id]: { ...draft, pct: Number(val) },
                        }))
                      }
                      disabled={!canEdit}
                    />
                  </Box>
                  <TextField
                    sx={{ minWidth: 220, flex: 1 }}
                    size="small"
                    placeholder="Note (optional)"
                    value={draft.note}
                    onChange={(e) =>
                      setDrafts((p) => ({
                        ...p,
                        [d._id]: { ...draft, note: e.target.value },
                      }))
                    }
                    disabled={!canEdit}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Save size={14} />}
                    onClick={() => save(d._id)}
                    disabled={!canEdit || !isDirty || busy === d._id}
                  >
                    {busy === d._id ? '…' : 'Save'}
                  </Button>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </AppCard>
  );
}

function RecentUpdates({
  updates,
  departments,
}: {
  updates: ProgressUpdate[];
  departments: Project['departments'];
}) {
  if (updates.length === 0) return null;
  const deptById = new Map(departments.map((d) => [d._id, d.name]));
  return (
    <AppCard>
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          Recent progress notes
        </Typography>
        <Stack spacing={1.5}>
          {updates.slice(0, 10).map((u) => (
            <Stack
              key={u._id}
              direction="row"
              spacing={2}
              alignItems="flex-start"
            >
              <Box
                sx={{
                  width: 64,
                  textAlign: 'right',
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'primary.main',
                }}
              >
                {u.percentComplete}%
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">
                  <strong>{deptById.get(u.departmentId) ?? 'Department'}</strong>{' '}
                  · {u.note || 'No note'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {u.createdAt
                    ? new Date(u.createdAt).toLocaleString()
                    : ''}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </AppCard>
  );
}

function MilestonesPanel({
  projectId,
  milestones,
  departments,
  canEdit,
  onChanged,
}: {
  projectId: string;
  milestones: Milestone[];
  departments: Project['departments'];
  canEdit: boolean;
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setError(null);
    if (!name.trim() || !plannedDate) {
      setError('Name and planned date are required.');
      return;
    }
    setBusy(true);
    try {
      await progressService.createMilestone(projectId, {
        name: name.trim(),
        plannedDate,
        departmentId: departmentId || null,
      });
      setName('');
      setDepartmentId('');
      setPlannedDate('');
      setAdding(false);
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save milestone.');
    } finally {
      setBusy(false);
    }
  };

  const complete = async (m: Milestone) => {
    try {
      await progressService.updateMilestone(m._id, {
        status: 'Completed',
        actualDate: new Date().toISOString().slice(0, 10),
      });
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not update milestone.');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this milestone?')) return;
    try {
      await progressService.removeMilestone(id);
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not delete milestone.');
    }
  };

  const deptById = new Map(departments.map((d) => [d._id, d.name]));

  return (
    <AppCard>
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1.5 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Milestones
          </Typography>
          {canEdit && (
            <Button
              size="small"
              startIcon={<Plus size={14} />}
              onClick={() => setAdding((v) => !v)}
            >
              {adding ? 'Cancel' : 'Add milestone'}
            </Button>
          )}
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {adding && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Department"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  <MenuItem value="">Project-level</MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d._id} value={d._id}>
                      {d.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Planned"
                  value={plannedDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={create}
                  disabled={busy}
                >
                  {busy ? '…' : 'Add'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {milestones.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No milestones yet.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {milestones.map((m) => {
              const overdue =
                m.status !== 'Completed' &&
                new Date(m.plannedDate).getTime() < Date.now();
              return (
                <Stack
                  key={m._id}
                  direction="row"
                  spacing={2}
                  alignItems="center"
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600 }}
                    >
                      {m.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {m.departmentId ? deptById.get(m.departmentId) ?? 'Department' : 'Project-level'}
                      {' · planned '}
                      {new Date(m.plannedDate).toLocaleDateString()}
                      {m.actualDate
                        ? ` · done ${new Date(m.actualDate).toLocaleDateString()}`
                        : overdue
                          ? ' · overdue'
                          : ''}
                    </Typography>
                  </Box>
                  <StatusChip
                    status={overdue && m.status !== 'Completed' ? 'AtRisk' : m.status}
                  />
                  {canEdit && (
                    <>
                      {m.status !== 'Completed' && (
                        <Tooltip title="Mark complete">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => complete(m)}
                          >
                            <CheckCircle2 size={16} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => remove(m._id)}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Stack>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </AppCard>
  );
}
