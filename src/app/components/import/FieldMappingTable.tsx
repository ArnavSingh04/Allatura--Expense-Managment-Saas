'use client';

import {
  Box,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Info } from 'lucide-react';
import {
  unmappedHeaders,
  type MemberView,
} from '@/components/import/importFlow';

const UNMAPPED = '';

type FieldMappingTableProps = {
  view: MemberView;
  /** Local draft overlay, so a select responds before the PATCH lands. */
  draft?: Record<string, string>;
  disabled?: boolean;
  onChange: (fieldKey: string, header: string) => void;
};

/**
 * Controlled field -> column grid for one file.
 *
 * Shows a sample value from the first row so the user can confirm a mapping by
 * eye rather than by column name alone.
 */
export default function FieldMappingTable({
  view,
  draft,
  disabled = false,
  onChange,
}: FieldMappingTableProps) {
  const mapping = draft ?? view.mapping;
  const sample = view.sampleRows[0];
  const leftover = unmappedHeaders({ ...view, mapping });

  return (
    <Stack spacing={1.5}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '32%' }}>Field</TableCell>
              <TableCell sx={{ width: '38%' }}>Column in file</TableCell>
              <TableCell sx={{ width: '30%' }}>Sample</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {view.fields.map((field) => {
              const selected = mapping[field.key] ?? UNMAPPED;
              const missing = field.required && !selected;
              const sampleValue = selected ? (sample?.[selected] ?? '') : '';

              return (
                <TableRow key={field.key} hover>
                  <TableCell>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      component="span"
                    >
                      <Typography variant="body2" component="span">
                        {field.label}
                        {field.required && (
                          <Box
                            component="span"
                            sx={{ color: 'error.main', ml: 0.25 }}
                          >
                            *
                          </Box>
                        )}
                      </Typography>
                      {field.hint && (
                        <Tooltip title={field.hint}>
                          <Box
                            component="span"
                            sx={{ display: 'inline-flex', opacity: 0.6 }}
                          >
                            <Info size={13} />
                          </Box>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={selected}
                      error={missing}
                      disabled={disabled}
                      onChange={(e) => onChange(field.key, e.target.value)}
                    >
                      <MenuItem value={UNMAPPED}>
                        <Box component="em" sx={{ opacity: 0.6 }}>
                          Not mapped
                        </Box>
                      </MenuItem>
                      {view.headers.map((header) => (
                        <MenuItem key={header} value={header}>
                          {header}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 200,
                      }}
                    >
                      {sampleValue || '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {leftover.length > 0 && (
        <Typography variant="caption" color="text.secondary">
          Columns in this file that are not mapped: {leftover.join(', ')}. They
          will be ignored.
        </Typography>
      )}
    </Stack>
  );
}
