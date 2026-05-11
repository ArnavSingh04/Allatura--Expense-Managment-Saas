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
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import AppCard from '@/components/ui/AppCard';
import EmptyState from '@/components/ui/EmptyState';
import DocumentDropzone from '@/components/construction/DocumentDropzone';
import DocumentGrid from '@/components/construction/DocumentGrid';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { authFetcher } from '@/lib/swr-fetcher';
import { keys } from '@/lib/swr-keys';
import {
  DOCUMENT_CATEGORIES,
  type AppDocument,
  type DocumentCategory,
} from '@/types/construction';

export default function ProjectDocumentsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { can } = useAuthSession();

  const [category, setCategory] = useState<'all' | DocumentCategory>('all');
  const [search, setSearch] = useState('');

  const swrKey = useMemo(
    () =>
      keys.documents({
        projectId: id,
        category: category === 'all' ? undefined : category,
        q: search || undefined,
      }),
    [id, category, search],
  );

  const { data: docs, isLoading, error } = useSWR<AppDocument[]>(
    id ? swrKey : null,
    authFetcher,
  );

  const refresh = () => void mutate(swrKey);

  if (error) return <Alert severity="error">{(error as Error).message}</Alert>;

  return (
    <Stack spacing={2.5}>
      {can('documents.upload') && (
        <AppCard>
          <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
              Upload to this project
            </Typography>
            <DocumentDropzone projectId={id} onUploaded={refresh} />
          </CardContent>
        </AppCard>
      )}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
      >
        <TextField
          select
          size="small"
          label="Category"
          value={category}
          onChange={(e) =>
            setCategory(e.target.value as 'all' | DocumentCategory)
          }
          sx={{ minWidth: 200 }}
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

      {isLoading ? (
        <LinearProgress />
      ) : (docs?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Files}
          title="No documents on this project"
          description={
            can('documents.upload')
              ? 'Drag in plans, contracts, invoices, and photos. Documents stay scoped to this job.'
              : 'Documents will appear here as the team uploads them.'
          }
        />
      ) : (
        <Box>
          <DocumentGrid documents={docs ?? []} onDeleted={refresh} />
        </Box>
      )}
    </Stack>
  );
}
