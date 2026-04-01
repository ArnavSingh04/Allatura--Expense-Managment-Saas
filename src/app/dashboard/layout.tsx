
import Grid from '@mui/material/Grid';
import SideMenuFrame from "@/components/dashboard/sideMenuFrame";
import { Suspense } from "react";
import { layoutStyles } from "@/styles/MaterialStyles/dashboard/layout/layoutStyles";

export default function DashboardLayout({
  children,

}: {
  children: React.ReactNode
}) {
  return (
    <section>
      <Grid container xs={12} sm={12} md={12}>

        <Grid item sx={layoutStyles.grid} xl={2} lg={2}>
          <SideMenuFrame>
            {/** <h1>NESTED COMPONENT</h1> */}
          </SideMenuFrame>
        </Grid>

        <Grid container direction="row" spacing={2} xs={12} sm={12} md={10} lg={10} xl={10}>
          <Grid sx={layoutStyles.gridItem} item xs={12} sm={12} md={12}>
            <Suspense>
              {children}
            </Suspense>
          </Grid>
        </Grid>
      </Grid>
    </section>
  )
}
