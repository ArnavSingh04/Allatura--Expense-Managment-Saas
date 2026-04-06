"use client";

import { FormEvent, useEffect } from "react";
import PlanCard from '@/components/plans/planCard';
import Box from '@mui/material/Box';
import Grid from '@mui/material/GridLegacy';
import { PLANS } from '@/data/plans';
import getStripe from "@/utils/get-stripe";
import { FrontendService } from "@/services/frontendService";
import { REQUEST_TYPE } from "@/lib/api-helper";
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import StackmarksLogo from "@/components/shared/stackmarksLogo";
import { planCardRoot } from "@/styles/MaterialStyles/plan/planCardStyles";
import { Suspense } from 'react'
import { submitRequest } from "@/utils/api-utils";

const checkRoute = async (id: any) => {
  const frontendService = new FrontendService(`checkout?id=${id}`);
  return await frontendService.sendRequest(REQUEST_TYPE.GET);
}

const PlanPage = () => {
  const router = useRouter()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  useEffect(() => {
    checkRoute(id).then((data: any) => (
      (data?.redirectURL) ? router.push(data.redirectURL) : (null)
    ))
  }, []);


  const selectPlan = async (e: FormEvent, planID: string, userID: string) => {
    e.preventDefault();

    const stripe = await getStripe();
    const result = (await submitRequest(
      { userID: userID, planID: planID },
      'checkout'
    )) as { id?: string };

    if (stripe && result?.id) {
      stripe.redirectToCheckout({
        sessionId: result.id,
      });
    }
  };

  return (
    <Suspense fallback={<p>Loading ...</p>}>

      <Box>
        <Grid
          sx={{ marginTop: '2%' }}
          container
          direction="column"
          spacing={3}
          justifyContent="center"
          alignItems="center"
        >
          <Grid item lg={12} xl={12} sx={{
            textAlign: 'center',
            display: { xs: 'none', sm: 'none', md: 'none', lg: 'block', xl: 'block' },
          }} >
            <StackmarksLogo />
          </Grid>

          <Grid
            sx={{
              marginTop: '2%',
              display: { xs: 'contents', sm: 'contents', md: 'contents', lg: 'flex', xl: 'flex' }
            }}
            container
            direction="row"
            spacing={3}
            justifyContent="center"
            alignItems="center"
          >
            {
              PLANS.map((plan: any, index: number) => (
                <Grid item xs={12} sm={12} md={5} lg={3} xl={3} key={`pplnitm${index + 10}`}>
                  <PlanCard
                    cardSX={planCardRoot}
                    key={`${index}${plan.title}`}
                    title={plan.title}
                    price={plan.price}
                    duration={plan.duration}
                    description={plan.description}
                    features={plan.features}
                    buttonDisabled={plan.buttonDisabled}
                    buttonText={plan.buttonText}
                    clickHandler={(e: FormEvent) => selectPlan(e, plan.productID, id!)}
                  />
                </Grid>
              ))
            }
          </Grid>
        </Grid>
      </Box >
    </Suspense>

  );
}

export default PlanPage;