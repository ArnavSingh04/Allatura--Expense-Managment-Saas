'use client';

import {
  Alert,
  Box,
  Button,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import AppCard from '@/components/ui/AppCard';
import EmptyState from '@/components/ui/EmptyState';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { ApiError } from '@/lib/api-client';
import { authFetcher } from '@/lib/swr-fetcher';
import { keys } from '@/lib/swr-keys';
import { siteLogService } from '@/services/siteLogService';
import type { Project, SiteLog, Subcontractor } from '@/types/construction';

const today = () => new Date().toISOString().slice(0, 10);

export default function ProjectSiteLogsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { can } = useAuthSession();

  const { data: project } = useSWR<Project>(
    id ? keys.project(id) : null,
    authFetcher,
  );
  const { data: subbies } = useSWR<Subcontractor[]>(keys.subbies(), authFetcher);
  const { data: logs, isLoading, error } = useSWR<SiteLog[]>(
    id ? keys.siteLogsByProject(id) : null,
    authFetcher,
  );

  const refresh = () => void mutate(keys.siteLogsByProject(id));

  const subbieById = new Map((subbies ?? []).map((s) => [s._id, s.name]));

  if (error) return <Alert severity="error">{(error as Error).message}</Alert>;
  if (isLoading || !project) return <LinearProgress />;

  return (
    <Stack spacing={2.5}>
      {can('sitelogs.create') && (
        <NewSiteLogForm
          projectId={id}
          subbies={subbies ?? []}
          onCreated={refresh}
        />
      )}

      {(logs?.length ?? 0) === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No site logs yet"
          description={
            can('sitelogs.create')
              ? 'Capture daily site activity, weather, crew presence, and any issues.'
              : 'Daily site logs will appear here.'
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {(logs ?? []).map((l) => (
            <AppCard key={l._id}>
              <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {new Date(l.logDate).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {l.weather || 'Weather not recorded'}
                      {l.temperatureC != null ? ` · ${l.temperatureC}°C` : ''}
                    </Typography>
                  </Box>
                </Stack>

                {l.workCompleted && (
                  <>
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 1.5 }}
                    >
                      Work completed
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {l.workCompleted}
                    </Typography>
                  </>
                )}

                {l.crewOnSite.length > 0 && (
                  <>
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 1.5 }}
                    >
                      Crew on site
                    </Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      {l.crewOnSite.map((c, i) => (
                        <Typography key={i} variant="body2">
                          {subbieById.get(c.subcontractorId) ?? 'Unknown'} ·{' '}
                          {c.headcount} crew
                          {c.hours ? ` · ${c.hours}h` : ''}
                        </Typography>
                      ))}
                    </Stack>
                  </>
                )}

                {(l.issues || l.safetyNotes) && (
                  <Divider sx={{ my: 1.5 }} />
                )}
                {l.issues && (
                  <>
                    <Typography
                      variant="overline"
                      color="error.main"
                      sx={{ display: 'block' }}
                    >
                      Issues
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {l.issues}
                    </Typography>
                  </>
                )}
                {l.safetyNotes && (
                  <>
                    <Typography
                      variant="overline"
                      color="warning.main"
                      sx={{ display: 'block', mt: 1 }}
                    >
                      Safety
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {l.safetyNotes}
                    </Typography>
                  </>
                )}
              </CardContent>
            </AppCard>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function NewSiteLogForm({
  projectId,
  subbies,
  onCreated,
}: {
  projectId: string;
  subbies: Subcontractor[];
  onCreated: () => void;
}) {
  const [logDate, setLogDate] = useState(today());
  const [weather, setWeather] = useState('');
  const [temp, setTemp] = useState('');
  const [workCompleted, setWorkCompleted] = useState('');
  const [issues, setIssues] = useState('');
  const [safetyNotes, setSafetyNotes] = useState('');
  const [crew, setCrew] = useState<
    Array<{ subcontractorId: string; headcount: string; hours: string }>
  >([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setLogDate(today());
    setWeather('');
    setTemp('');
    setWorkCompleted('');
    setIssues('');
    setSafetyNotes('');
    setCrew([]);
  };

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await siteLogService.create(projectId, {
        logDate,
        weather: weather.trim() || undefined,
        temperatureC: temp ? Number(temp) : undefined,
        workCompleted: workCompleted.trim() || undefined,
        issues: issues.trim() || undefined,
        safetyNotes: safetyNotes.trim() || undefined,
        crewOnSite: crew
          .filter((c) => c.subcontractorId && c.headcount)
          .map((c) => ({
            subcontractorId: c.subcontractorId,
            headcount: Number(c.headcount),
            hours: Number(c.hours) || 0,
          })),
      });
      reset();
      onCreated();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save site log.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppCard>
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          New site log
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              type="date"
              label="Date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 8, sm: 5 }}>
            <TextField
              fullWidth
              label="Weather"
              placeholder="Sunny, 28°C"
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 4, sm: 3 }}>
            <TextField
              fullWidth
              label="Temp"
              type="number"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">°C</InputAdornment>,
              }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Work completed"
              value={workCompleted}
              onChange={(e) => setWorkCompleted(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Issues / delays"
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Safety notes"
              value={safetyNotes}
              onChange={(e) => setSafetyNotes(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2">Crew on site</Typography>
              <Button
                size="small"
                startIcon={<Plus size={14} />}
                onClick={() =>
                  setCrew((p) => [
                    ...p,
                    { subcontractorId: '', headcount: '', hours: '' },
                  ])
                }
              >
                Add crew
              </Button>
            </Stack>
            {crew.length > 0 && (
              <Stack spacing={1}>
                {crew.map((c, i) => (
                  <Stack key={i} direction="row" spacing={1.5} alignItems="center">
                    <TextField
                      select
                      size="small"
                      label="Subcontractor"
                      value={c.subcontractorId}
                      onChange={(e) =>
                        setCrew((p) =>
                          p.map((x, idx) =>
                            idx === i
                              ? { ...x, subcontractorId: e.target.value }
                              : x,
                          ),
                        )
                      }
                      sx={{ flex: 2 }}
                    >
                      {subbies.map((s) => (
                        <MenuItem key={s._id} value={s._id}>
                          {s.name}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      size="small"
                      label="Crew #"
                      type="number"
                      value={c.headcount}
                      onChange={(e) =>
                        setCrew((p) =>
                          p.map((x, idx) =>
                            idx === i
                              ? { ...x, headcount: e.target.value }
                              : x,
                          ),
                        )
                      }
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small"
                      label="Hours"
                      type="number"
                      value={c.hours}
                      onChange={(e) =>
                        setCrew((p) =>
                          p.map((x, idx) =>
                            idx === i ? { ...x, hours: e.target.value } : x,
                          ),
                        )
                      }
                      sx={{ flex: 1 }}
                    />
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() =>
                        setCrew((p) => p.filter((_, idx) => idx !== i))
                      }
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            )}
          </Grid>
        </Grid>

        <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
          <Button onClick={reset} disabled={busy}>
            Reset
          </Button>
          <Button variant="contained" onClick={submit} disabled={busy}>
            {busy ? 'Saving…' : 'Save site log'}
          </Button>
        </Stack>
      </CardContent>
    </AppCard>
  );
}
