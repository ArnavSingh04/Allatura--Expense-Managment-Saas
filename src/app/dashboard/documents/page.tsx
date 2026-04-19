'use client';

import {
  Alert,
  Box,
  CardContent,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Files } from 'lucide-react';
import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import AppCard from '@/components/ui/AppCard';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import DocumentDropzone from '@/components/construction/DocumentDropzone';
import DocumentGrid from '@/components/construction/DocumentGrid';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { authFetcher } from '@/lib/swr-fetcher';
import { keys } from '@/lib/swr-keys';
import {
  DOCUMENT_CATEGORIES,
  type AppDocument,
  type DocumentCategory,
  type Project,
} from '@/types/construction';

export default function DocumentsLibraryPage() {
  const { can } = useAuthSession();
  const [category, setCategory] = useState<'all' | DocumentCategory>('all');
  const [projectId, setProjectId] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: projects } = useSWR<Project[]>(keys.projects(), authFetcher);

  const swrKey = useMemo(
    () =>
      keys.documents({
        projectId: projectId === 'all' ? undefined : projectId,
        category: category === 'all' ? undefined : category,
        q: search || undefined,
      }),
    [projectId, category, search],
  );

  const { data: docs, isLoading, error } = useSWR<AppDocument[]>(
    swrKey,
    authFetcher,
  );

  const refresh = () => void mutate(swrKey);

  return (
    <Box>
      <PageHeader
        title="Documents"
        description="Every uploaded plan, contract, invoice, and photo across your jobs."
      />

      {can('documents.upload') && (
        <AppCard sx={{ mb: 2.5 }}>
          <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
              Quick upload
            </Typography>
            <DocumentDropzone
              projectId={projectId === 'all' ? undefined : projectId}
              onUploaded={refresh}
            />
          </CardContent>
        </AppCard>
      )}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <TextField
          select
          size="small"
          label="Project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          sx={{ minWidth: 240 }}
        >
          <MenuItem value="all">All projects</MenuItem>
          {(projects ?? []).map((p) => (
            <MenuItem key={p._id} value={p._id}>
              {p.code} — {p.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Category"
          value={category}
          onChange={(e) =>
            setCategory(e.target.value as 'all' | DocumentCategory)
          }
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">All categories</MenuItem>
          {DOCUMENT_CATEGORIES.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label="Search"
          placeholder="Filename or tag"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1 }}
        />
      </Stack>

      {error && <Alert severity="error">{(error as Error).message}</Alert>}
      {isLoading ? (
        <LinearProgress />
      ) : (docs?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Files}
          title="No documents found"
          description="Try a different filter or upload some files above."
        />
      ) : (
        <DocumentGrid documents={docs ?? []} onDeleted={refresh} />
      )}
    </Box>
  );
}
