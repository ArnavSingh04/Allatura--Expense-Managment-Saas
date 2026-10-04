'use client';

import { Box, type BoxProps } from '@mui/material';
import Image, { type ImageProps } from 'next/image';

type MarketingImageProps = Omit<ImageProps, 'alt'> & {
  alt: string;
  boxProps?: BoxProps;
};

/**
 * Opinionated wrapper for static marketing assets under `/public` (e.g. `/photos/*.webp`).
 */
export default function MarketingImage({ alt, boxProps, style, ...img }: MarketingImageProps) {
  const { sx: boxSx, ...restBox } = boxProps ?? {};
  return (
    <Box {...restBox} sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2, ...boxSx }}>
      <Image alt={alt} style={{ width: '100%', height: 'auto', display: 'block', ...style }} {...img} />
    </Box>
  );
}
