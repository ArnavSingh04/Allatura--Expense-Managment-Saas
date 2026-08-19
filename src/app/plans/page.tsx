"use client";

import { FormEvent, useEffect, useMemo } from "react";
import PlanCard from "@/components/plans/planCard";
import Box from "@mui/material/Box";
import Grid from "@mui/material/GridLegacy";
import { PLANS, type PlanCardData } from "@/data/plans";
import getStripe from "@/utils/get-stripe";
import { REQUEST_TYPE } from "@/lib/api-helper";
import StackmarksLogo from "@/components/shared/stackmarksLogo";
import { planCardRoot } from "@/styles/MaterialStyles/plan/planCardStyles";
import { Suspense } from "react";
import { submitRequest } from "@/utils/api-utils";
import { useAuthSession } from "@/contexts/AuthSessionContext";
import { FrontendService } from "@/services/frontendService";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

const checkRoute = async (id: string | null) => {
  if (!id) return null;
  const frontendService = new FrontendService(`checkout?id=${id}`);
  return frontendService.sendRequest(REQUEST_TYPE.GET);
};

const PlanPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { session, ready } = useAuthSession();

  const isAuthed = useMemo(() => Boolean(session?.sub), [ready, session?.sub]);

  useEffect(() => {
    if (!id) return;
    void checkRoute(id).then((data) => {
      const d = data as { redirectURL?: string } | null | undefined;
      if (d?.redirectURL) router.push(d.redirectURL);
    });
  }, [id, router]);

  const selectPlan = async (
    e: FormEvent,
    plan: PlanCardData,
    userID: string,
  ) => {
    e.preventDefault();
    if (!plan.productID) return;
    const stripe = await getStripe();
    const result = (await submitRequest(
      { userID, planID: plan.productID },
      "checkout",
    )) as { id?: string };

    if (stripe && result?.id) {
      await stripe.redirectToCheckout({ sessionId: result.id });
    }
  };

  const cardProps = useMemo(() => {
    return PLANS.map((plan) => {
      const isPaid = plan.tier !== "free";
      if (!isAuthed) {
        if (plan.tier === "free") {
          return { plan, url: "/register" as const };
        }
        return { plan, url: "/register" as const };
      }
      if (plan.tier === "free") {
        return { plan, url: "/dashboard" as const };
      }
      if (plan.productID) {
        const userId = session?.sub;
        if (!userId) {
          return { plan, url: "/register" as const };
        }
        return {
          plan,
          url: undefined as undefined,
          clickHandler: (e: FormEvent) => selectPlan(e, plan, userId),
        };
      }
      return { plan, url: "/dashboard/settings" as const };
    });
  }, [isAuthed, session?.sub]);

  return (
    <Suspense fallback={<p>Loading ...</p>}>
      <Box>
        <Grid
          sx={{ marginTop: "2%" }}
          container
          direction="column"
          spacing={3}
          justifyContent="center"
          alignItems="center"
        >
          <Grid
            item
            lg={12}
            xl={12}
            sx={{
              textAlign: "center",
              display: {
                xs: "none",
                sm: "none",
                md: "none",
                lg: "block",
                xl: "block",
              },
            }}
          >
            <StackmarksLogo />
          </Grid>

          <Grid
            sx={{
              marginTop: "2%",
              display: {
                xs: "contents",
                sm: "contents",
                md: "contents",
                lg: "flex",
                xl: "flex",
              },
            }}
            container
            direction="row"
            spacing={3}
            justifyContent="center"
            alignItems="center"
          >
            {cardProps.map(({ plan, url, clickHandler }, index) => (
              <Grid
                item
                xs={12}
                sm={12}
                md={5}
                lg={3}
                xl={3}
                key={`${plan.tier}-${index}`}
              >
                <PlanCard
                  cardSX={planCardRoot}
                  title={plan.title}
                  price={plan.price}
                  duration={plan.duration}
                  description={plan.description}
                  features={plan.features}
                  buttonDisabled={plan.buttonDisabled}
                  buttonText={plan.buttonText}
                  url={url}
                  clickHandler={clickHandler}
                />
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Box>
    </Suspense>
  );
};

export default PlanPage;
