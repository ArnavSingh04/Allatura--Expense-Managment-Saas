'use client';

import Typography, { type TypographyProps } from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { plutus } from '@/theme/tokens';

/**
 * Serif “ALLATURA” wordmark. Light mode: forest ink. Dark mode: forest ink + invert for a light wordmark on dark chrome (skipped when prefers-reduced-motion).
 */
export default function AllaturaWordmark(props: TypographyProps) {
  const { sx, ...rest } = props;
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { defaultMatches: false });

  return (
    <Typography
      {...rest}
      className="customfont"
      sx={[
        (theme) => ({
          color: plutus.color.primary,
          ...(theme.palette.mode === 'dark' &&
            (reduceMotion
              ? { color: theme.palette.text.primary }
              : { filter: 'invert(1) brightness(1.12)' })),
        }),
        ...(Array.isArray(sx) ? sx : sx != null ? [sx] : []),
      ]}
    />
  );
}
