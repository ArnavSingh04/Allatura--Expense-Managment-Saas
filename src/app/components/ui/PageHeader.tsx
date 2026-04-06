'use client';

import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'flex-start' },
        justifyContent: 'space-between',
        gap: 2,
        mb: 3,
      }}
    >
      <Box>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontSize: { xs: '1.5rem', md: '1.75rem' },
            fontWeight: 600,
            letterSpacing: '-0.03em',
            color: 'text.primary',
            mb: description ? 0.5 : 0,
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
            {description}
          </Typography>
        )}
      </Box>
      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
    </Box>
  );
}
