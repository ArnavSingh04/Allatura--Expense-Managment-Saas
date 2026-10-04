import { Noto_Serif, Plus_Jakarta_Sans } from 'next/font/google';
import { alpha, createTheme, type PaletteMode } from '@mui/material/styles';
import { plutus } from '@/theme/tokens';

const plusJakarta = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const notoSerif = Noto_Serif({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export function createAllaturaTheme(mode: PaletteMode) {
  const isDark = mode === 'dark';

  const border = isDark ? 'rgba(208, 200, 188, 0.16)' : plutus.color.border;
  const tableHeadBg = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(27, 48, 34, 0.04)';
  const rowHover = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(27, 48, 34, 0.04)';

  return createTheme({
    palette: {
      mode,
      primary: isDark
        ? {
            main: '#d4af37',
            dark: '#b8922d',
            light: '#e3c464',
            contrastText: '#1b3022',
          }
        : {
            main: plutus.color.primary,
            dark: plutus.color.primaryDark,
            contrastText: '#f9f8f6',
          },
      secondary: {
        main: isDark ? '#cdb8a1' : plutus.color.accentViolet,
      },
      background: isDark
        ? {
            default: '#101610',
            paper: '#1a221b',
          }
        : {
            default: plutus.color.bg,
            paper: plutus.color.surface,
          },
      text: isDark
        ? {
            primary: '#f7f3ea',
            secondary: '#c4b8a7',
          }
        : {
            primary: plutus.color.text,
            secondary: plutus.color.muted,
          },
      divider: border,
      success: { main: isDark ? '#c3d2b1' : '#2f6b3f' },
      error: { main: isDark ? '#e09a86' : plutus.color.accentRose },
      warning: { main: isDark ? '#d4af37' : plutus.color.accentAmber },
    },
    shape: {
      borderRadius: plutus.radius.md,
    },
    typography: {
      fontFamily: plusJakarta.style.fontFamily,
      h1: { fontFamily: notoSerif.style.fontFamily, fontWeight: 600, letterSpacing: '-0.02em' },
      h2: { fontFamily: notoSerif.style.fontFamily, fontWeight: 600, letterSpacing: '-0.02em' },
      h3: { fontFamily: notoSerif.style.fontFamily, fontWeight: 600, letterSpacing: '-0.02em' },
      h4: { fontFamily: notoSerif.style.fontFamily, fontWeight: 600, letterSpacing: '-0.01em' },
      h5: { fontFamily: notoSerif.style.fontFamily, fontWeight: 600 },
      h6: { fontFamily: notoSerif.style.fontFamily, fontWeight: 600 },
      subtitle1: {
        fontWeight: 500,
        color: isDark ? '#c4b8a7' : plutus.color.muted,
      },
      subtitle2: {
        fontWeight: 500,
        color: isDark ? '#c4b8a7' : plutus.color.muted,
      },
      body1: { lineHeight: 1.6 },
      body2: {
        lineHeight: 1.6,
        color: isDark ? '#c4b8a7' : plutus.color.muted,
      },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: isDark ? `${alpha('#c4b8a7', 0.5)} transparent` : `${plutus.color.subtle} transparent`,
            backgroundImage: isDark
              ? 'radial-gradient(1200px 600px at 50% -10%, rgba(212, 175, 55, 0.08), transparent), radial-gradient(900px 500px at 100% 0%, rgba(90, 74, 58, 0.14), transparent)'
              : 'radial-gradient(1200px 600px at 50% -10%, rgba(27, 48, 34, 0.08), transparent), radial-gradient(900px 500px at 100% 0%, rgba(212, 175, 55, 0.18), transparent)',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
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
              boxShadow: isDark ? `0 2px 12px ${alpha('#d4af37', 0.3)}` : plutus.shadow.card,
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
