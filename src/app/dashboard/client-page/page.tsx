'use client';

import Grid from "@mui/material/GridLegacy";
import { Suspense, useState, useEffect } from 'react'
import { submitRequest } from "@/utils/api-utils";
import LoadingSpinner from "@/components/shared/loadingSpinner";
import { dashboardHeader, dashboardSubheader } from "@/styles/MaterialStyles/shared/sharedStyles";
import { Typography } from "@mui/material";

const ClientPageExample = () => {
  const [resp, setData] = useState<any>(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    submitRequest({}, 'dashboard').then((resp: any) => (
      setData(resp.data),
      setLoading(false)
    ))
  }, []);

  if (isLoading) return <LoadingSpinner />
  if (!resp) return <p>An Error Occured</p>

  return (
    <>
      <Suspense fallback={<LoadingSpinner />}>
        <Grid
          spacing={2}
          container
          alignItems="flex-start"
        >
          <Grid item xs={12}>
            <Typography variant="body1" sx={dashboardHeader}>
              CLIENT SIDE RENDERED PAGE
            </Typography>

          </Grid>

          <Grid item xs={12}>
            <Typography variant="body1" sx={dashboardSubheader}>
              Activity: {resp.data.activity}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body1" sx={dashboardSubheader}>
              Link: {resp.data.link? resp.data.link : "no - link"}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body1" sx={dashboardSubheader}>
              Type: {resp.data.type}
            </Typography>
          </Grid>
        </Grid>
      </Suspense>
    </>

  )

}

export default ClientPageExample;