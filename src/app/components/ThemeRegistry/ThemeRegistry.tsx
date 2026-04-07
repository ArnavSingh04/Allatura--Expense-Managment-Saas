'use client';

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import NextAppDirEmotionCacheProvider from './EmotionCache';
import { createPlutusTheme } from './theme';
import { ColorModeProvider, useColorMode } from '@/lib/colorModeContext';

function ThemeRegistryInner({ children }: { children: React.ReactNode }) {
  const { resolvedMode } = useColorMode();
  const theme = React.useMemo(() => createPlutusTheme(resolvedMode), [resolvedMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
      <ColorModeProvider>
        <ThemeRegistryInner>{children}</ThemeRegistryInner>
      </ColorModeProvider>
    </NextAppDirEmotionCacheProvider>
  );
}
