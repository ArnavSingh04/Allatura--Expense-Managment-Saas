'use client';

import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Download,
  File,
  FileImage,
  FileText,
  FileType2,
  Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import AppCard from '@/components/ui/AppCard';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { ApiError } from '@/lib/api-client';
import { documentService } from '@/services/documentService';
import type { AppDocument } from '@/types/construction';

function pickIcon(mime: string): LucideIcon {
  if (mime.startsWith('image/')) return FileImage;
  if (mime === 'application/pdf') return FileType2;
  if (mime.startsWith('text/') || mime.includes('json') || mime.includes('csv')) return FileText;
  return File;
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
  documents: AppDocument[];
  onDeleted?: () => void;
};

export default function DocumentGrid({ documents, onDeleted }: Props) {
  const { can } = useAuthSession();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const download = async (doc: AppDocument) => {
    setError(null);
    setBusy(doc._id);
    try {
      const { url } = await documentService.download(doc._id);
      if (url.startsWith('stub://')) {
        setError(
          'Download not available — storage is in dev mode. Configure GCS to enable downloads.',
        );
      } else {
        window.open(url, '_blank', 'noopener');
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not get download URL.');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (doc: AppDocument) => {
    if (!confirm(`Delete ${doc.fileName}?`)) return;
    setError(null);
    setBusy(doc._id);
    try {
      await documentService.remove(doc._id);
      onDeleted?.();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not delete document.');
    } finally {
      setBusy(null);
    }
  };

  if (documents.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No documents match the current filters.
      </Typography>
    );
  }

  return (
    <>
      {error && (
        <Typography variant="body2" color="error.main" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Grid container spacing={2}>
        {documents.map((doc) => {
          const Icon = pickIcon(doc.mimeType);
          return (
            <Grid key={doc._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <AppCard hover sx={{ height: '100%' }}>
                <Box sx={{ p: 2 }}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="flex-start"
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1.5,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.85,
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={doc.fileName}
                      >
                        {doc.fileName}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {doc.category} · {formatBytes(doc.sizeBytes)}
                      </Typography>
                    </Box>
                  </Stack>
                  {doc.tags.length > 0 && (
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ mt: 1, flexWrap: 'wrap' }}
                    >
                      {doc.tags.map((t) => (
                        <Chip key={t} size="small" label={t} variant="outlined" />
                      ))}
                    </Stack>
                  )}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mt: 1.5 }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {doc.createdAt
                        ? new Date(doc.createdAt).toLocaleDateString()
                        : ''}
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Download">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => download(doc)}
                            disabled={busy === doc._id}
                          >
                            <Download size={16} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      {can('documents.delete') && (
                        <Tooltip title="Delete">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => remove(doc)}
                              disabled={busy === doc._id}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              </AppCard>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
}
