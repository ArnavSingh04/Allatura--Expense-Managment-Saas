'use client';

import { Card, type CardProps } from '@mui/material';
import { plutus } from '@/theme/tokens';

type AppCardProps = CardProps & {
  hover?: boolean;
};

export default function AppCard({ hover = false, sx, children, ...rest }: AppCardProps) {
  return (
    <Card
      {...rest}
      sx={{
        borderRadius: `${plutus.radius.lg}px`,
        border: `1px solid ${plutus.color.border}`,
        boxShadow: plutus.shadow.card,
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        ...(hover && {
          '&:hover': {
            boxShadow: plutus.shadow.cardHover,
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
