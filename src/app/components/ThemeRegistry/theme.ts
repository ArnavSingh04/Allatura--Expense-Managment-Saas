import { Inter } from 'next/font/google';
import { alpha, createTheme, type PaletteMode } from '@mui/material/styles';
import { plutus } from '@/theme/tokens';

const inter = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export function createPlutusTheme(mode: PaletteMode) {
  const isDark = mode === 'dark';

  const border = isDark ? 'rgba(148, 163, 184, 0.18)' : plutus.color.border;
  const tableHeadBg = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.02)';
  const rowHover = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.03)';

  return createTheme({
    palette: {
      mode,
      primary: isDark
        ? {
            main: '#2dd4bf',
            dark: '#14b8a6',
            light: '#5eead4',
            contrastText: '#0f172a',
          }
        : {
            main: plutus.color.primary,
            dark: plutus.color.primaryDark,
            contrastText: '#ffffff',
          },
      secondary: {
        main: isDark ? '#818cf8' : plutus.color.accentViolet,
      },
      background: isDark
        ? {
            default: '#0f172a',
            paper: '#1e293b',
          }
        : {
            default: plutus.color.bg,
            paper: plutus.color.surface,
          },
      text: isDark
        ? {
            primary: '#f1f5f9',
            secondary: '#94a3b8',
          }
        : {
            primary: plutus.color.text,
            secondary: plutus.color.muted,
          },
      divider: border,
      success: { main: isDark ? '#2dd4bf' : plutus.color.primary },
      error: { main: isDark ? '#fb7185' : plutus.color.accentRose },
      warning: { main: isDark ? '#fbbf24' : plutus.color.accentAmber },
    },
    shape: {
      borderRadius: plutus.radius.md,
    },
    typography: {
      fontFamily: inter.style.fontFamily,
      h1: { fontWeight: 600, letterSpacing: '-0.03em' },
      h2: { fontWeight: 600, letterSpacing: '-0.02em' },
      h3: { fontWeight: 600, letterSpacing: '-0.02em' },
      h4: { fontWeight: 600, letterSpacing: '-0.02em' },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle1: {
        fontWeight: 500,
        color: isDark ? '#94a3b8' : plutus.color.muted,
      },
      subtitle2: {
        fontWeight: 500,
        color: isDark ? '#94a3b8' : plutus.color.muted,
      },
      body1: { lineHeight: 1.6 },
      body2: {
        lineHeight: 1.6,
        color: isDark ? '#94a3b8' : plutus.color.muted,
      },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: isDark ? `${alpha('#94a3b8', 0.5)} transparent` : `${plutus.color.subtle} transparent`,
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: plutus.radius.sm,
            fontWeight: 600,
            textTransform: 'none',
            transition: 'background-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
          },
          containedPrimary: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: isDark ? `0 2px 12px ${alpha('#2dd4bf', 0.25)}` : plutus.shadow.card,
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.15s ease, color 0.15s ease',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: plutus.radius.lg,
            border: `1px solid ${border}`,
            boxShadow: isDark
              ? '0 1px 2px rgba(0, 0, 0, 0.35), 0 4px 16px rgba(0, 0, 0, 0.25)'
              : plutus.shadow.card,
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: plutus.radius.sm,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: isDark ? '#94a3b8' : plutus.color.muted,
            borderBottom: `1px solid ${border}`,
            backgroundColor: tableHeadBg,
          },
          body: {
            borderColor: border,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.12s ease',
            '&:hover': { backgroundColor: rowHover },
          },
        },
      },
      MuiLink: {
        defaultProps: { underline: 'hover' },
      },
      MuiAlert: {
        styleOverrides: {
          root: ({ ownerState }) => ({
            ...(ownerState.severity === 'info' && {
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)',
              color: isDark ? '#f1f5f9' : plutus.color.text,
            }),
          }),
        },
      },
    },
  });
}
