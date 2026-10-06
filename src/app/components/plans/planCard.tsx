'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import Link from 'next/link';
import type { SxProps, Theme } from '@mui/material/styles';
import { buttonStyle, buttonStyleDisabled } from '@/styles/MaterialStyles/plan/planCard/planCardButtonStyle';
import { planCardIcons } from '@/styles/MaterialStyles/plan/planCardStyles';
import { plutus } from '@/theme/tokens';

type planProps = {
  title: string;
  price: string;
  description: string;
  features: string[];
  buttonDisabled: boolean;
  duration: string;
  clickHandler?: (e: React.FormEvent) => void;
  buttonText: string;
  url?: string;
  cardSX?: SxProps<Theme>;
  popular?: boolean;
};

const CardButton = (props: { buttonDisabled: boolean; clickHandler?: (e: React.FormEvent) => void; buttonText: string }) => {
  const { buttonDisabled, clickHandler, buttonText } = props;
  return (
    <Button
      fullWidth
      size="large"
      disabled={buttonDisabled}
      onClick={clickHandler}
      sx={buttonDisabled ? buttonStyleDisabled : buttonStyle}
    >
      {buttonText}
    </Button>
  );
};

const LinkButton = (props: { buttonText: string; url: string }) => {
  const { buttonText, url } = props;
  return (
    <Button fullWidth size="large" component={Link} href={url} sx={buttonStyle}>
      {buttonText}
    </Button>
  );
};

const FeatureList = (props: { feature: string }) => (
  <ListItem sx={{ px: 0, py: 0.5 }} disableGutters dense>
    <ListItemIcon sx={{ minWidth: 34 }}>
      <CheckCircleRoundedIcon sx={planCardIcons} />
    </ListItemIcon>
    <ListItemText
      primary={
        <Typography variant="body2" color="text.secondary">
          {props.feature}
        </Typography>
      }
    />
  </ListItem>
);

const PlanCard = (props: planProps) => {
  const {
    title,
    price,
    description,
    features,
    buttonDisabled,
    duration,
    buttonText,
    clickHandler,
    url,
    cardSX,
    popular,
  } = props;

  return (
    <Card
      sx={[
        ...(Array.isArray(cardSX) ? cardSX : [cardSX]),
        (theme) => ({
          position: 'relative',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          ...(popular && {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 0 1px ${theme.palette.primary.main}, ${plutus.shadow.card}`,
          }),
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.45), 0 8px 24px rgba(0, 0, 0, 0.3)'
                : plutus.shadow.cardHover,
          },
        }),
      ]}
    >
      <CardContent sx={{ flexGrow: 1, p: { xs: 2.5, md: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            minHeight: 28,
            mb: 1,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary' }}
          >
            {title}
          </Typography>
          {popular && (
            <Chip label="Most popular" size="small" color="primary" sx={{ fontWeight: 700 }} />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 1.5, justifyContent: { xs: 'center', lg: 'flex-start' } }}>
          <Typography variant="h4" component="span" sx={{ fontWeight: 600 }}>
            {price}
          </Typography>
          {duration && (
            <Typography variant="body2" color="text.secondary" component="span">
              {duration}
            </Typography>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
          {description}
        </Typography>

        <List sx={{ width: '100%', textAlign: 'left' }} disablePadding>
          {features.map((item, index) => (
            <FeatureList key={item + index} feature={item} />
          ))}
        </List>
      </CardContent>
      <CardActions sx={{ p: { xs: 2.5, md: 3 }, pt: 0 }}>
        {url ? (
          <LinkButton buttonText={buttonText} url={url} />
        ) : (
          <CardButton buttonDisabled={buttonDisabled} clickHandler={clickHandler} buttonText={buttonText} />
        )}
      </CardActions>
    </Card>
  );
};

export default PlanCard;
