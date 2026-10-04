'use client';

import type { ReactNode } from 'react';
import MarketingImage from '@/components/marketing/MarketingImage';

const heroSrc = process.env.NEXT_PUBLIC_LANDING_HERO_IMAGE?.trim();

type MarketingHeroImageProps = {
  /** Shown when `NEXT_PUBLIC_LANDING_HERO_IMAGE` is unset */
  fallback: ReactNode;
  /** Passed to next/image when using hero asset */
  priority?: boolean;
};

export default function MarketingHeroImage({ fallback, priority = true }: MarketingHeroImageProps) {
  if (!heroSrc) {
    return <>{fallback}</>;
  }

  return (
    <MarketingImage
      src={heroSrc}
      alt="Allatura product dashboard preview"
      width={1200}
      height={720}
      priority={priority}
      sizes="(max-width: 900px) 100vw, 900px"
      boxProps={{ sx: { bgcolor: 'background.default' } }}
    />
  );
}
