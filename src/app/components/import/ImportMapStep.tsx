'use client';

import {
  Alert,
  Box,
  Button,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PackMemberRail from '@/components/import/PackMemberRail';
import FieldMappingTable from '@/components/import/FieldMappingTable';
import {
  firstIncompleteMember,
  memberKey,
  type MemberView,
} from '@/components/import/importFlow';
import type {
  DuplicatePolicy,
  ImportEntityType,
  ImportSession,
} from '@/types/imports';

const POLICY_LABEL: Record<DuplicatePolicy, string> = {
  skip: 'Skip existing records',
  update: 'Update existing records',
  create: 'Create duplicates anyway',
};

type ImportMapStepProps = {
  session: ImportSession;
  views: MemberView[];
  selectedKey: string;
  onSelectMember: (key: string) => void;
  draftMapping: Record<string, Record<string, string>>;
  busy: boolean;
  onMappingChange: (
    fieldKey: string,
    header: string,
    member: ImportEntityType | null,
  ) => void;
  onPolicyChange: (
    policy: DuplicatePolicy,
    member: ImportEntityType | null,
  ) => void;
};

export default function ImportMapStep({
  session,
  views,
  selectedKey,
  onSelectMember,
  draftMapping,
  busy,
  onMappingChange,
  onPolicyChange,
}: ImportMapStepProps) {
  const isPack = views.length > 1;
  const view = views.find((v) => memberKey(v) === selectedKey) ?? views[0];
  const incomplete = firstIncompleteMember(session);

  if (!view) return null;

  return (
    <Stack spacing={2}>
      {incomplete && (
        <Alert
          severity="warning"
          action={
            isPack && memberKey(incomplete) !== selectedKey ? (
              <Button
                size="small"
                color="inherit"
                onClick={() => onSelectMember(memberKey(incomplete))}
              >
                Go to it
              </Button>
            ) : undefined
          }
        >
          {incomplete.unmappedRequired.length} required{' '}
          {incomplete.unmappedRequired.length === 1 ? 'field is' : 'fields are'}{' '}
          still unmapped
          {isPack ? ` in ${incomplete.label}` : ''}.
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {isPack && (
          <PackMemberRail
            views={views}
            selectedKey={selectedKey}
            onSelect={onSelectMember}
            mode="map"
          />
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {view.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {view.fileName} · {view.rowCount}{' '}
                {view.rowCount === 1 ? 'row' : 'rows'}
              </Typography>
            </Box>

            <TextField
              select
              size="small"
              label="Duplicate handling"
              value={view.duplicatePolicy}
              disabled={busy}
              onChange={(e) =>
                onPolicyChange(e.target.value as DuplicatePolicy, view.member)
              }
              sx={{ minWidth: 220 }}
            >
              {(
                Object.keys(POLICY_LABEL) as DuplicatePolicy[]
              ).map((policy) => (
                <MenuItem key={policy} value={policy}>
                  {POLICY_LABEL[policy]}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <FieldMappingTable
            view={view}
            draft={draftMapping[memberKey(view)]}
            disabled={busy}
            onChange={(fieldKey, header) =>
              onMappingChange(fieldKey, header, view.member)
            }
          />
        </Box>
      </Stack>
    </Stack>
  );
}
