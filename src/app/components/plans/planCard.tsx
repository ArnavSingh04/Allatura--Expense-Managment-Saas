import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { ListItemIcon } from '@mui/material';
import { buttonStyle, buttonStyleDisabled } from '@/styles/MaterialStyles/plan/planCard/planCardButtonStyle';
import Link from 'next/link';
import { dashboardHeader, dashboardSubheader } from '@/styles/MaterialStyles/shared/sharedStyles';
import { planCardIcons } from '@/styles/MaterialStyles/plan/planCardStyles';

type planProps = {
  title: string, price: string, description: string, features: string[], buttonDisabled: boolean, duration: string,
  clickHandler?: any, key?: string, buttonText: string, url?: string, cardSX?: any
}

const CardButton = (props: { buttonDisabled: boolean, clickHandler: any, buttonText: string }) => {
  const { buttonDisabled, clickHandler, buttonText } = props;

  return (
    <Button fullWidth disabled={buttonDisabled} onClick={clickHandler}
      sx={buttonDisabled ? buttonStyleDisabled : buttonStyle}
    >
      {buttonText}
    </Button>
  );
}

const LinkButton = (props: { buttonText: string, url: string }) => {
  const { buttonText, url } = props;

  return (
    <Link href={url}>
      <Button variant="outlined" sx={{ color: 'red', border: '2px solid red' }}>
        {buttonText}
      </Button>
    </Link>
  );
}

const FeatureList = (props: { feature: string }) => {
  return (
    <>
      <ListItem sx={{padding: '0.2rem'}} disableGutters={true} disablePadding={true} dense={true} key={props.feature + "--2"}>
        <ListItemIcon>
          <CheckCircleRoundedIcon sx={planCardIcons} />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography sx={dashboardSubheader} variant="body1">
              {props.feature}
            </Typography>
          }
        />
      </ListItem>
    </>
  )
}

const PlanCardContent = (props: planProps) => {
  const { title, price, description, duration, features, buttonDisabled, clickHandler, url, buttonText } = props;

  return (
    <>
      <CardContent>
        <Typography variant="body1" sx={dashboardSubheader} gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" sx={dashboardHeader} gutterBottom>
          {price} <span>{duration}</span>
        </Typography>
        <Typography variant="body1" sx={dashboardSubheader} gutterBottom>
          {description}
        </Typography>
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {
            features.map((item: any, index: number) => (
              <FeatureList key={item + index} feature={item} />
            ))
          }
        </List>
      </CardContent>
      <CardActions>
        {
          url ? <LinkButton buttonText={buttonText} url={url} /> :
            <CardButton buttonDisabled={buttonDisabled} clickHandler={clickHandler}
              buttonText={buttonText} />
        }
      </CardActions>
    </>
  );
};

const PlanCard = (props: planProps) => {
  const { title, price, description, features, buttonDisabled, duration,
    buttonText, clickHandler, url, key, cardSX } = props;

  return (
    <Card sx={cardSX}>
      <PlanCardContent
        key={key}
        title={title}
        price={price}
        duration={duration}
        description={description}
        features={features}
        buttonText={buttonText}
        buttonDisabled={buttonDisabled}
        clickHandler={clickHandler}
        url={url}
      />
    </Card>
  );
}

export default PlanCard;