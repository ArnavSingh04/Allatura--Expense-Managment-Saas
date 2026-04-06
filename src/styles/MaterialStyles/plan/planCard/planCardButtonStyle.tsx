import type { SxProps, Theme } from '@mui/material/styles';

export const buttonStyle: SxProps<Theme> = {
  textTransform: 'none',
  fontWeight: 600,
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  '&:hover': { bgcolor: 'primary.dark' },
};

export const buttonStyleDisabled: SxProps<Theme> = {
  textTransform: 'none',
  fontWeight: 600,
  bgcolor: 'warning.light',
  color: 'warning.contrastText',
};
