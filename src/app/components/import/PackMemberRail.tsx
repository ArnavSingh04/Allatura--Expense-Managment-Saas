'use client';

import {
  Box,
  Divider,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { AlertTriangle, Check } from 'lucide-react';
import { memberKey, type MemberView } from '@/components/import/importFlow';

type PackMemberRailProps = {
  views: MemberView[];
  selectedKey: string;
  onSelect: (key: string) => void;
  /** 'map' shows mapping readiness; 'review' shows preview counts. */
  mode: 'map' | 'review';
};

/**
 * The left rail listing every file in a pack.
 *
 * Deliberately not tabs: the wizard already has a horizontal step indicator
 * directly above, and a second horizontal selector under it reads as competing
 * navigation. A rail also shows every member's readiness at once, and renders
 * them in the backend's import order — which is what teaches the user that
 * later files may reference earlier ones.
 */
export default function PackMemberRail({
  views,
  selectedKey,
  onSelect,
  mode,
}: PackMemberRailProps) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  const totalRows = views.reduce((n, v) => n + v.rowCount, 0);
  const totalDuplicates = views.reduce(
    (n, v) => n + (v.preview?.summary.duplicates ?? 0),
    0,
  );
  const totalInvalid = views.reduce(
    (n, v) => n + (v.preview?.summary.invalid ?? 0),
    0,
  );

  return (
    <Stack
      direction={{ xs: 'row', md: 'column' }}
      spacing={0.5}
      sx={{
        minWidth: { md: 220 },
        maxWidth: { md: 220 },
        overflowX: { xs: 'auto', md: 'visible' },
        pb: { xs: 1, md: 0 },
      }}
    >
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ display: { xs: 'none', md: 'block' }, px: 1 }}
      >
        Files in this pack
      </Typography>

      {views.map((view) => {
        const key = memberKey(view);
        const selected = key === selectedKey;
        const ready =
          mode === 'map'
            ? view.unmappedRequired.length === 0
            : view.preview !== null;
        const summary = view.preview?.summary;

        return (
          <Box
            key={key}
            onClick={() => onSelect(key)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect(key);
            }}
            sx={{
              px: 1.5,
              py: 1,
              borderRadius: 1.5,
              cursor: 'pointer',
              whiteSpace: { xs: 'nowrap', md: 'normal' },
              bgcolor: selected ? 'action.selected' : 'transparent',
              borderLeft: { xs: 'none', md: '3px solid' },
              borderLeftColor: {
                md: selected ? 'primary.main' : 'transparent',
              },
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              {ready ? (
                <Check size={15} color={theme.palette.success.main} />
              ) : (
                <AlertTriangle size={15} color={theme.palette.warning.main} />
              )}
              <Typography
                variant="body2"
                sx={{ fontWeight: selected ? 700 : 500, flex: 1 }}
              >
                {view.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {view.rowCount}
              </Typography>
            </Stack>
            {mode === 'review' && summary && !isSmall && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ pl: 3 }}
              >
                {summary.valid} valid
                {summary.duplicates > 0 && ` · ${summary.duplicates} dup`}
                {summary.invalid > 0 && ` · ${summary.invalid} invalid`}
              </Typography>
            )}
          </Box>
        );
      })}

      {!isSmall && (
        <>
          <Divider sx={{ my: 1 }} />
          {mode === 'review' ? (
            <Box sx={{ px: 1.5 }}>
              <Typography variant="overline" color="text.secondary">
                Total
              </Typography>
              <Typography variant="body2">{totalRows} rows</Typography>
              {totalDuplicates > 0 && (
                <Typography variant="body2" color="warning.main">
                  {totalDuplicates} duplicates
                </Typography>
              )}
              {totalInvalid > 0 && (
                <Typography variant="body2" color="error.main">
                  {totalInvalid} invalid
                </Typography>
              )}
            </Box>
          ) : (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ px: 1.5 }}
            >
              Files import in this order. Later files may reference codes and
              names defined in earlier ones.
            </Typography>
          )}
        </>
      )}
    </Stack>
  );
}
