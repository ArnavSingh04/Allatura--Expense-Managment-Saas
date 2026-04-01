'use client'

import { Button, Grid } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { buttonStyle } from '@/styles/MaterialStyles/shared/sharedStyles';
import Link from 'next/link';
import { sideMenuGrid } from '@/styles/MaterialStyles/dashboard/sideMenuStyles';

export default function SideMenuFrame({ children }: { children: React.ReactNode }) {


  return (
    <Grid
      container
      direction="column"
      justifyContent="flex-start"
      alignItems="baseline"
      spacing={2}
    >
      <Grid item sx={sideMenuGrid} xs={12}>
        <h1 className='customfont'>DASHBOARD</h1>
      </Grid>

      <Grid item sx={sideMenuGrid} xs={12}>
        <Link href="/dashboard/server-page">
          <Button
            startIcon={<HomeIcon />}
            fullWidth
            variant="contained"
            sx={buttonStyle}
          >
            Server Side Render
          </Button>
        </Link>
      </Grid>

      <Grid item sx={sideMenuGrid} xs={12}>
        <Link href="/dashboard/client-page">
          <Button
            startIcon={<HomeIcon />}
            fullWidth
            variant="contained"
            sx={buttonStyle}
          >
            Client Side Render
          </Button>
        </Link>
      </Grid>

      <Grid item sx={sideMenuGrid} xs={12}>
        <Link href="/dashboard/form-example">
          <Button
            startIcon={<HomeIcon />}
            fullWidth
            variant="contained"
            sx={buttonStyle}
          >
            Form Example Page
          </Button>
        </Link>
      </Grid>

      {children}

    </Grid>
  );
}