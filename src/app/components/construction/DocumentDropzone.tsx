'use client';

import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';
import { ApiError } from '@/lib/api-client';
import { uploadFile } from '@/services/documentService';
import {
  DOCUMENT_CATEGORIES,
  type AppDocument,
  type DocumentCategory,
  type DocumentEntityType,
} from '@/types/construction';

type Props = {
  projectId?: string;
  contractId?: string;
  entityType?: DocumentEntityType;
  entityId?: string;
  defaultCategory?: DocumentCategory;
  onUploaded?: (doc: AppDocument) => void;
};

export default function DocumentDropzone({
  projectId,
  contractId,
  entityType,
  entityId,
  defaultCategory = 'Other',
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState(0);
  const [category, setCategory] = useState<DocumentCategory>(defaultCategory);
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    setBusy((b) => b + files.length);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    for (const file of Array.from(files)) {
      try {
        const doc = await uploadFile(file, {
          category,
          projectId,
          contractId,
          entityType,
          entityId,
          tags,
        });
        onUploaded?.(doc);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : `Failed to upload ${file.name}`);
      } finally {
        setBusy((b) => b - 1);
      }
    }
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mb: 1.5 }}
      >
        <TextField
          select
          size="small"
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as DocumentCategory)}
          sx={{ minWidth: 160 }}
        >
          {DOCUMENT_CATEGORIES.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label="Tags (comma separated)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          sx={{ flex: 1 }}
        />
      </Stack>

      <Box
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setHover(true);
        }}
        onDragLeave={() => setHover(false)}
        onDrop={(e) => {
          e.preventDefault();
          setHover(false);
          upload(e.dataTransfer.files);
        }}
        sx={{
          border: '2px dashed',
          borderColor: hover ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: hover ? 'action.hover' : 'background.default',
          transition: 'all 0.15s ease',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => upload(e.target.files)}
        />
        <UploadCloud size={28} style={{ opacity: 0.7 }} />
        <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
          Drop files here or click to browse
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Plans, contracts, invoices, photos — anything project-related.
        </Typography>
        {busy > 0 && (
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mt: 1.5 }}>
            <CircularProgress size={16} />
            <Typography variant="caption">Uploading {busy}…</Typography>
          </Stack>
        )}
      </Box>

      {tagsInput && (
        <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
          {tagsInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
            .map((t) => (
              <Chip key={t} size="small" label={t} />
            ))}
        </Stack>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
