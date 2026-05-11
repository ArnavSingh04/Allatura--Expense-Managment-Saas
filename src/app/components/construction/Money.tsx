'use client';

import { Box } from '@mui/material';
import { formatMoney, formatMoneyCompact, type Money as TMoney } from '@/lib/money';

type Props = {
  value: TMoney | undefined | null;
  compact?: boolean;
  decimals?: number;
  fallback?: string;
  bold?: boolean;
};

export default function Money({ value, compact, decimals, fallback, bold }: Props) {
  return (
    <Box
      component="span"
      sx={{
        fontWeight: bold ? 700 : 500,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {compact
        ? value
          ? formatMoneyCompact(value)
          : (fallback ?? '—')
        : formatMoney(value, { decimals, fallback })}
    </Box>
  );
}
