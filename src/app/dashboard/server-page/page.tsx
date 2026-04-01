import { submitRequest } from "@/utils/api-utils";
import { dashboardHeader, dashboardSubheader } from '@/styles/MaterialStyles/shared/sharedStyles';
import { Grid, Typography } from '@mui/material';

export default async function ServerExamplePage(context: any) {
  const req = await submitRequest({ context: context }, 'dashboard').then((data: any) => {
    if (data?.error) { return data.error };
    return data.data;
  })

  return (
    <>
      <Grid
        spacing={2}
        container
        alignItems="flex-start"
      >
        <Grid item xs={12}>
          <Typography variant="body1" sx={dashboardHeader}>
            Server Side Rendered Page
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1" sx={dashboardSubheader}>
            Activity: {req.data?.activity}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1" sx={dashboardSubheader}>
            Link: {req.data?.link ? req.data?.link : "no - link"}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1" sx={dashboardSubheader}>
            Type: {req.data?.type}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1" sx={dashboardSubheader}>
            {req.data?.error}
          </Typography>
        </Grid>
      </Grid>
    </>
  );
}

