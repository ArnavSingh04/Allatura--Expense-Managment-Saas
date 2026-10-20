'use client';

import { Chip } from '@mui/material';
import type { ImportRowStatus } from '@/types/imports';

const COLOR: Record<ImportRowStatus, 'success' | 'warning' | 'error'> = {
  valid: 'success',
  duplicate: 'warning',
  invalid: 'error',
};

const LABEL: Record<ImportRowStatus, string> = {
  valid: 'Valid',
  duplicate: 'Duplicate',
  invalid: 'Invalid',
};

export default function ImportRowStatusChip({
  status,
}: {
  status: ImportRowStatus;
}) {
  return (
    <Chip
      label={LABEL[status]}
      size="small"
      color={COLOR[status]}
      variant="filled"
      sx={{ fontWeight: 600 }}
    />
  );
}
