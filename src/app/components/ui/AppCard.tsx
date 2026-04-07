'use client';

import { Card, type CardProps, useTheme } from '@mui/material';
import { plutus } from '@/theme/tokens';

type AppCardProps = CardProps & {
  hover?: boolean;
};

export default function AppCard({ hover = false, sx, children, ...rest }: AppCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      {...rest}
      sx={{
        borderRadius: `${plutus.radius.lg}px`,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: isDark
          ? '0 1px 2px rgba(0, 0, 0, 0.35), 0 4px 16px rgba(0, 0, 0, 0.25)'
          : plutus.shadow.card,
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        ...(hover && {
          '&:hover': {
            boxShadow: isDark
              ? '0 4px 20px rgba(0, 0, 0, 0.45), 0 8px 24px rgba(0, 0, 0, 0.3)'
              : plutus.shadow.cardHover,
            transform: 'translateY(-1px)',
          },
        }),
        ...sx,
      }}
    >
      {children}
    </Card>
  );
}
