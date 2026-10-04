'use client';

import { Box, useTheme } from '@mui/material';
import dynamic from 'next/dynamic';
import LandingFeatureGrid from '@/components/marketing/LandingFeatureGrid';
import LandingFinalCta from '@/components/marketing/LandingFinalCta';
import LandingFooter from '@/components/marketing/LandingFooter';
import LandingHero from '@/components/marketing/LandingHero';
import LandingHowItWorks from '@/components/marketing/LandingHowItWorks';
import LandingTrustStrip from '@/components/marketing/LandingTrustStrip';
import MarketingNav from '@/components/marketing/MarketingNav';
import MotionSection from '@/components/marketing/MotionSection';

const LandingIndustries = dynamic(() => import('@/components/marketing/LandingIndustries'), {
  loading: () => <Box sx={{ minHeight: 280 }} aria-hidden />,
});

const LandingPlatformShowcase = dynamic(() => import('@/components/marketing/LandingPlatformShowcase'), {
  loading: () => <Box sx={{ minHeight: 420 }} aria-hidden />,
});

export default function LandingPageClient() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        backgroundImage: isDark
          ? `
          radial-gradient(ellipse 85% 55% at 50% -18%, rgba(212, 175, 55, 0.14), transparent),
          radial-gradient(ellipse 55% 42% at 100% 0%, rgba(90, 74, 58, 0.2), transparent)
        `
          : `
          radial-gradient(ellipse 85% 55% at 50% -18%, rgba(27, 48, 34, 0.12), transparent),
          radial-gradient(ellipse 55% 42% at 100% 0%, rgba(212, 175, 55, 0.18), transparent)
        `,
      }}
    >
      <MarketingNav />
      <Box component="main">
        <LandingHero />
        <MotionSection id="features" aria-labelledby="features-heading" sx={{ scrollMarginTop: 88 }}>
          <LandingFeatureGrid />
        </MotionSection>
        <MotionSection id="how" aria-labelledby="how-heading" sx={{ scrollMarginTop: 88 }}>
          <LandingHowItWorks />
        </MotionSection>
        <MotionSection id="industries" aria-labelledby="industries-heading" sx={{ scrollMarginTop: 88 }}>
          <LandingIndustries />
        </MotionSection>
        <MotionSection id="platform" aria-labelledby="platform-heading" sx={{ scrollMarginTop: 88 }}>
          <LandingPlatformShowcase />
        </MotionSection>
        <MotionSection sx={{ scrollMarginTop: 88 }}>
          <LandingTrustStrip />
        </MotionSection>
        <MotionSection id="contact" sx={{ scrollMarginTop: 88 }}>
          <LandingFinalCta />
        </MotionSection>
      </Box>
      <LandingFooter />
    </Box>
  );
}
