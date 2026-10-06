import type { SxProps, Theme } from '@mui/material/styles';

// Feature-list check marks — brand colour, no heavy filled chip.
export const planCardIcons: SxProps<Theme> = {
  fontSize: { xs: '1.2rem', xl: '1.35rem' },
  color: 'primary.main',
};

// Layout only. Border, radius, and resting shadow come from the themed MuiCard
// (matches the landing cards); hover elevation is applied in PlanCard.
export const planCardRoot: SxProps<Theme> = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  textAlign: { xs: 'center', lg: 'left' },
};
