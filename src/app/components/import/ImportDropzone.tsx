'use client';

import { useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { UploadCloud } from 'lucide-react';
import {
  ACCEPT_ANY,
  ACCEPT_SHEET,
  MAX_SHEET_BYTES,
  MAX_ZIP_BYTES,
  formatBytes,
  isSheetFile,
  isZipFile,
} from '@/lib/import-limits';
import type { ImportTarget } from '@/types/imports';

type ImportDropzoneProps = {
  /** What the user currently intends to import. */
  target: ImportTarget;
  disabled?: boolean;
  /**
   * Called when a zip is chosen while a single entity type is selected, so the
   * wizard can switch to Pack rather than letting the server 400.
   */
  onRequestPackMode: () => void;
  onFileAccepted: (file: File) => void;
  onLocalError: (message: string) => void;
};

/**
 * File picker for the import wizard.
 *
 * Everything checkable without a round trip is checked here: size, emptiness,
 * extension, and whether the extension matches the chosen target. That removes
 * the whole class of `pack_requires_zip` / `zip_requires_pack` round trips and
 * gives the user a message that names the actual file.
 */
export default function ImportDropzone({
  target,
  disabled = false,
  onRequestPackMode,
  onFileAccepted,
  onLocalError,
}: ImportDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  const accept = target === 'pack' ? ACCEPT_ANY : ACCEPT_SHEET;

  function handle(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    if (file.size === 0) {
      onLocalError("That file is empty. Check you saved it before uploading.");
      return;
    }

    const zip = isZipFile(file.name);
    const sheet = isSheetFile(file.name);

    if (!zip && !sheet) {
      onLocalError(
        'Unsupported file type. Upload a .csv or .xlsx file, or a .zip pack.',
      );
      return;
    }

    const cap = zip ? MAX_ZIP_BYTES : MAX_SHEET_BYTES;
    if (file.size > cap) {
      onLocalError(
        `${file.name} is ${formatBytes(file.size)}. The limit is ${formatBytes(
          cap,
        )} — split the data and import it in parts.`,
      );
      return;
    }

    // A zip is always a pack. Switch the mode for the user instead of
    // bouncing them off the server's zip_requires_pack error.
    if (zip && target !== 'pack') {
      onRequestPackMode();
      onFileAccepted(file);
      return;
    }

    if (!zip && target === 'pack') {
      onLocalError(
        'A pack must be a .zip containing one file per entity type. Pick a single entity type for a .csv or .xlsx.',
      );
      return;
    }

    onFileAccepted(file);
  }

  return (
    <Box
      onClick={() => {
        if (!disabled) inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        if (!disabled) handle(e.dataTransfer.files);
      }}
      sx={{
        border: '2px dashed',
        borderColor: hover ? 'primary.main' : 'divider',
        borderRadius: 2,
        p: 5,
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        bgcolor: hover ? 'action.hover' : 'background.default',
        transition: 'all 0.15s ease',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        disabled={disabled}
        onChange={(e) => {
          handle(e.target.files);
          // Allow re-picking the same file after a failed attempt.
          e.target.value = '';
        }}
      />
      <Stack spacing={1} alignItems="center">
        <UploadCloud size={32} style={{ opacity: 0.7 }} />
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          Drop a file here, or click to browse
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {target === 'pack'
            ? `A .zip holding one spreadsheet per entity type, up to ${formatBytes(MAX_ZIP_BYTES)}.`
            : `CSV or Excel, up to ${formatBytes(MAX_SHEET_BYTES)} — or drop a .zip to import several types at once.`}
        </Typography>
      </Stack>
    </Box>
  );
}
