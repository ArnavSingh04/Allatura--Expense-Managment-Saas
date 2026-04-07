'use client';

import * as React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAllaturaTheme } from './theme';
import { ColorModeProvider, useColorMode, type ColorModePreference } from '@/lib/colorModeContext';

function ThemeRegistryInner({ children }: { children: React.ReactNode }) {
  const { resolvedMode } = useColorMode();
  const theme = React.useMemo(() => createAllaturaTheme(resolvedMode), [resolvedMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default function ThemeRegistry({
  children,
  initialColorMode = 'light',
}: {
  children: React.ReactNode;
  initialColorMode?: ColorModePreference;
}) {
  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ColorModeProvider initialColorMode={initialColorMode}>
        <ThemeRegistryInner>{children}</ThemeRegistryInner>
      </ColorModeProvider>
    </AppRouterCacheProvider>
  );
}
