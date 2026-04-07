import type { SxProps, Theme } from '@mui/material/styles';

export const dashboardHeader: SxProps<Theme> = {
  fontSize: { xs: '1.375rem', md: '1.5rem' },
  fontWeight: 600,
  letterSpacing: '-0.02em',
  color: 'text.primary',
  lineHeight: 1.25,
  mb: 0.5,
  mt: 0,
};

export const dashboardSubheader: SxProps<Theme> = {
  fontSize: '0.875rem',
  color: 'text.secondary',
  fontWeight: 400,
  lineHeight: 1.5,
};

/** Legacy name, prefer theme `Button` defaults; kept for form-example */
export const buttonStyle: SxProps<Theme> = {
  textTransform: 'none',
  fontWeight: 600,
  borderRadius: 1.5,
  px: 2,
  py: 1,
};
