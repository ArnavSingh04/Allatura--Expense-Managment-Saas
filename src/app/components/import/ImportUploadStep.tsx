'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Download } from 'lucide-react';
import ImportDropzone from '@/components/import/ImportDropzone';
import { importErrorMessage } from '@/lib/import-errors';
import { importService } from '@/services/importService';
import {
  IMPORT_ENTITY_TYPES,
  type ImportEntityType,
  type ImportTarget,
  type ImportTypeDef,
} from '@/types/imports';

type ImportUploadStepProps = {
  types: ImportTypeDef[];
  target: ImportTarget;
  onTargetChange: (target: ImportTarget) => void;
  uploading: boolean;
  onFileAccepted: (file: File) => void;
  onLocalError: (message: string) => void;
};

function isEntityType(value: ImportTarget): value is ImportEntityType {
  return (IMPORT_ENTITY_TYPES as readonly string[]).includes(value);
}

export default function ImportUploadStep({
  types,
  target,
  onTargetChange,
  uploading,
  onFileAccepted,
  onLocalError,
}: ImportUploadStepProps) {
  const [downloading, setDownloading] = useState(false);
  const [switchedToPack, setSwitchedToPack] = useState(false);

  async function downloadTemplate() {
    if (!isEntityType(target)) return;
    setDownloading(true);
    try {
      await importService.downloadTemplate(target);
    } catch (e) {
      onLocalError(importErrorMessage(e));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <TextField
          select
          fullWidth
          label="What are you importing?"
          value={target}
          disabled={uploading}
          onChange={(e) => {
            setSwitchedToPack(false);
            onTargetChange(e.target.value as ImportTarget);
          }}
          sx={{ maxWidth: 420 }}
        >
          {types.map((t) => (
            <MenuItem key={t.entityType} value={t.entityType}>
              {t.label}
            </MenuItem>
          ))}
        </TextField>

        {target === 'pack' ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1.5, maxWidth: 560 }}
          >
            A pack is one .zip holding a spreadsheet per entity type — name each
            file after its type, for example{' '}
            <Box component="code" sx={{ fontFamily: 'monospace' }}>
              01-suppliers.csv
            </Box>
            . They import in dependency order, so a contract may reference a
            project defined in another file in the same pack.
          </Typography>
        ) : (
          <Button
            size="small"
            startIcon={
              downloading ? <CircularProgress size={14} /> : <Download size={16} />
            }
            onClick={downloadTemplate}
            disabled={downloading || uploading}
            sx={{ mt: 1.5 }}
          >
            Download template
          </Button>
        )}
      </Box>

      {switchedToPack && (
        <Alert severity="info" onClose={() => setSwitchedToPack(false)}>
          That is a zip, so we have switched the import type to Pack.
        </Alert>
      )}

      {uploading ? (
        <Stack spacing={1.5} alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
          <Typography variant="body2" color="text.secondary">
            Reading your file…
          </Typography>
        </Stack>
      ) : (
        <ImportDropzone
          target={target}
          disabled={uploading}
          onRequestPackMode={() => {
            setSwitchedToPack(true);
            onTargetChange('pack');
          }}
          onFileAccepted={onFileAccepted}
          onLocalError={onLocalError}
        />
      )}

      <Typography variant="caption" color="text.secondary">
        Nothing is saved to your records yet. The file is staged so you can map
        its columns and review every row before anything is imported.
      </Typography>
    </Stack>
  );
}
