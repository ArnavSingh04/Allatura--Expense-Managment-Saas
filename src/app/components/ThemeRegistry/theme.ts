import { Inter } from 'next/font/google';
import { createTheme } from '@mui/material/styles';
import { plutus } from '@/theme/tokens';

const inter = Inter({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: plutus.color.primary,
      dark: plutus.color.primaryDark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: plutus.color.accentViolet,
    },
    background: {
      default: plutus.color.bg,
      paper: plutus.color.surface,
    },
    text: {
      primary: plutus.color.text,
      secondary: plutus.color.muted,
    },
    divider: plutus.color.border,
    success: { main: plutus.color.primary },
    error: { main: plutus.color.accentRose },
    warning: { main: plutus.color.accentAmber },
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
    subtitle1: { fontWeight: 500, color: plutus.color.muted },
    subtitle2: { fontWeight: 500, color: plutus.color.muted },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.6, color: plutus.color.muted },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: `${plutus.color.subtle} transparent`,
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
          '&:hover': { boxShadow: plutus.shadow.card },
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
          border: `1px solid ${plutus.color.border}`,
          boxShadow: plutus.shadow.card,
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
          color: plutus.color.muted,
          borderBottom: `1px solid ${plutus.color.border}`,
          backgroundColor: 'rgba(15, 23, 42, 0.02)',
        },
        body: {
          borderColor: plutus.color.border,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.12s ease',
          '&:hover': { backgroundColor: 'rgba(15, 23, 42, 0.03)' },
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
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            color: plutus.color.text,
          }),
        }),
      },
    },
  },
});

export default theme;
