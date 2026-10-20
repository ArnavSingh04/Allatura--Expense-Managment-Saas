'use client';

import { Alert, Box, Divider, Stack, Typography } from '@mui/material';
import PackMemberRail from '@/components/import/PackMemberRail';
import ImportSummaryTiles from '@/components/import/ImportSummaryTiles';
import PreviewRowsTable from '@/components/import/PreviewRowsTable';
import { memberKey, type MemberView } from '@/components/import/importFlow';
import type { DuplicatePolicy, ImportEntityType } from '@/types/imports';

type ImportReviewStepProps = {
  views: MemberView[];
  selectedKey: string;
  onSelectMember: (key: string) => void;
  busy: boolean;
  onRowAction: (
    row: number,
    action: DuplicatePolicy,
    member: ImportEntityType | null,
  ) => void;
};

export default function ImportReviewStep({
  views,
  selectedKey,
  onSelectMember,
  busy,
  onRowAction,
}: ImportReviewStepProps) {
  const isPack = views.length > 1;
  const view = views.find((v) => memberKey(v) === selectedKey) ?? views[0];

  if (!view) return null;

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
      {isPack && (
        <PackMemberRail
          views={views}
          selectedKey={selectedKey}
          onSelect={onSelectMember}
          mode="review"
        />
      )}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {view.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {view.fileName} · {view.rowCount}{' '}
            {view.rowCount === 1 ? 'row' : 'rows'}
          </Typography>
        </Box>

        {view.preview ? (
          <Stack spacing={2}>
            <ImportSummaryTiles summary={view.preview.summary} />

            {view.preview.summary.invalid > 0 && (
              <Alert severity="warning">
                Invalid rows are skipped automatically. Fix them in the source
                file and import it again if you need them.
              </Alert>
            )}

            <Divider />

            <PreviewRowsTable
              rows={view.preview.rows}
              busy={busy}
              onRowAction={(row, action) =>
                onRowAction(row, action, view.member)
              }
            />
          </Stack>
        ) : (
          <Alert severity="info">
            This file has not been previewed yet.
          </Alert>
        )}
      </Box>
    </Stack>
  );
}
