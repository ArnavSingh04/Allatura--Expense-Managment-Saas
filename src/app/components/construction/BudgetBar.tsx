'use client';

import { Box, LinearProgress, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { formatMoney, percent, type Money } from '@/lib/money';

export type BudgetBarProps = {
  budget: Money;
  committed: Money;
  paid: Money;
  size?: 'sm' | 'md';
};

export default function BudgetBar({ budget, committed, paid, size = 'md' }: BudgetBarProps) {
  const theme = useTheme();
  const totalDenom = budget.amount || 1;
  const committedPct = Math.min(100, percent(committed.amount, totalDenom));
  const paidPct = Math.min(committedPct, percent(paid.amount, totalDenom));
  const overrun = committed.amount > budget.amount;

  const barHeight = size === 'sm' ? 8 : 12;

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ position: 'relative', height: barHeight, borderRadius: 999 }}>
        <LinearProgress
          variant="determinate"
          value={committedPct}
          sx={{
            height: barHeight,
            borderRadius: 999,
            bgcolor: alpha(theme.palette.text.primary, 0.08),
            '& .MuiLinearProgress-bar': {
              bgcolor: overrun
                ? theme.palette.error.main
                : theme.palette.warning.main,
              borderRadius: 999,
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${paidPct}%`,
            height: barHeight,
            bgcolor: theme.palette.success.main,
            borderRadius: 999,
          }}
        />
      </Box>
      {size !== 'sm' && (
        <Stack
          direction="row"
          spacing={2}
          sx={{ mt: 1, color: 'text.secondary', flexWrap: 'wrap' }}
        >
          <Typography variant="caption">
            <Box component="span" sx={{ color: 'success.main', fontWeight: 700 }}>
              ●
            </Box>{' '}
            Paid {formatMoney(paid)}
          </Typography>
          <Typography variant="caption">
            <Box
              component="span"
              sx={{
                color: overrun ? 'error.main' : 'warning.main',
                fontWeight: 700,
              }}
            >
              ●
            </Box>{' '}
            Committed {formatMoney(committed)} ({committedPct.toFixed(1)}%)
          </Typography>
          <Typography variant="caption">
            Budget {formatMoney(budget)}
          </Typography>
        </Stack>
      )}
    </Box>
  );
}
