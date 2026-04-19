'use client';

import {
  Alert,
  Avatar,
  Box,
  Button,
  CardContent,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Trash2, UserPlus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import AppCard from '@/components/ui/AppCard';
import EmptyState from '@/components/ui/EmptyState';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { ApiError } from '@/lib/api-client';
import { authFetcher } from '@/lib/swr-fetcher';
import { keys } from '@/lib/swr-keys';
import { projectService } from '@/services/projectService';
import type { ProjectMember } from '@/types/construction';

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
};

const PROJECT_ROLES: ProjectMember['projectRole'][] = [
  'PM',
  'Supervisor',
  'Finance',
  'Subcontractor',
  'Viewer',
];

export default function ProjectTeamPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { can, session } = useAuthSession();
  const isOwner = session?.role === 'owner' || session?.role === 'admin';
  const canEdit = can('projects.edit') || isOwner;

  const { data: members, isLoading, error } = useSWR<ProjectMember[]>(
    id ? keys.projectMembers(id) : null,
    authFetcher,
  );
  const { data: users } = useSWR<UserRow[]>(canEdit ? 'users' : null, authFetcher);

  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<ProjectMember['projectRole']>('PM');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = () => void mutate(keys.projectMembers(id));

  const add = async () => {
    setActionError(null);
    if (!userId) {
      setActionError('Pick a teammate to add.');
      return;
    }
    setBusy(true);
    try {
      await projectService.addMember(id, { userId, projectRole: role });
      setUserId('');
      refresh();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Could not add member.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (memberUserId: string) => {
    if (!confirm('Remove from project?')) return;
    setActionError(null);
    try {
      await projectService.removeMember(id, memberUserId);
      refresh();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Could not remove member.');
    }
  };

  if (error) return <Alert severity="error">{(error as Error).message}</Alert>;
  if (isLoading) return <LinearProgress />;

  const userById = new Map((users ?? []).map((u) => [u.id, u]));
  const memberIds = new Set((members ?? []).map((m) => m.userId));
  const candidates = (users ?? []).filter(
    (u) => u.status === 'Active' && !memberIds.has(u.id),
  );

  return (
    <Stack spacing={2.5}>
      {actionError && <Alert severity="error">{actionError}</Alert>}

      {canEdit && (
        <AppCard>
          <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
              Add team member
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ sm: 'center' }}
            >
              <TextField
                select
                fullWidth
                size="small"
                label="Person"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <MenuItem value="">Select…</MenuItem>
                {candidates.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name || u.email} ({u.email})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Role on this project"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as ProjectMember['projectRole'])
                }
                sx={{ minWidth: 200 }}
              >
                {PROJECT_ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                onClick={add}
                disabled={busy}
                startIcon={<UserPlus size={16} />}
              >
                Add
              </Button>
            </Stack>
          </CardContent>
        </AppCard>
      )}

      {(members?.length ?? 0) === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No project-level access yet"
          description="Owners can always see the project. Add PMs, supervisors, finance and subbies to scope visibility per job."
        />
      ) : (
        <AppCard>
          <CardContent sx={{ p: 0 }}>
            <Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>
              {(members ?? []).map((m) => {
                const user = userById.get(m.userId);
                return (
                  <Stack
                    key={m.userId}
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ p: 2 }}
                  >
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {(user?.name || user?.email || '?')
                        .slice(0, 1)
                        .toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {user?.name || user?.email || m.userId}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user?.email ?? '—'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {m.projectRole}
                    </Typography>
                    {canEdit && (
                      <Tooltip title="Remove">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => remove(m.userId)}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                );
              })}
            </Stack>
          </CardContent>
        </AppCard>
      )}
    </Stack>
  );
}
