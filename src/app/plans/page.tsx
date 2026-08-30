"use client";

import { FormEvent, useMemo, useState } from "react";
import PlanCard from "@/components/plans/planCard";
import Box from "@mui/material/Box";
import Grid from "@mui/material/GridLegacy";
import Alert from "@mui/material/Alert";
import { PLANS, type PlanCardData } from "@/data/plans";
import StackmarksLogo from "@/components/shared/stackmarksLogo";
import { planCardRoot } from "@/styles/MaterialStyles/plan/planCardStyles";
import { useAuthSession } from "@/contexts/AuthSessionContext";
import { billingService } from "@/services/billingService";
import { ApiError } from "@/lib/api-client";

function friendlyBillingError(err: unknown): string {
  const raw = err instanceof ApiError ? err.message : String(err);
  switch (raw) {
    case "already_on_plan_or_higher":
      return "You're already on this plan or a higher one.";
    case "stripe_not_configured":
      return "Billing isn't configured yet. Please try again shortly.";
    case "invalid_plan":
      return "That plan can't be selected.";
    case "Forbidden":
    case "forbidden_role":
      return "Only an organisation owner or admin can change the plan.";
    case "missing_env:STRIPE_PRICE_PRO":
    case "missing_env:STRIPE_PRICE_ENTERPRISE":
      return "This plan isn't available for purchase yet.";
    default:
      return raw || "Something went wrong starting checkout.";
  }
}

const PlanPage = () => {
  const { session } = useAuthSession();
  const isAuthed = useMemo(() => Boolean(session?.sub), [session?.sub]);
  const [busyTier, setBusyTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Signed in + paid tier → ask the backend to create a Checkout Session and
  // redirect to the URL it returns. No Stripe.js, no keys on the client.
  const startCheckout = async (e: FormEvent, plan: PlanCardData) => {
    e.preventDefault();
    if (plan.tier === "free") return;
    setError(null);
    setBusyTier(plan.tier);
    try {
      const { url } = await billingService.checkout(plan.tier);
      if (url) {
        window.location.assign(url);
      } else {
        setError("Could not start checkout. Please try again.");
        setBusyTier(null);
      }
    } catch (err) {
      setError(friendlyBillingError(err));
      setBusyTier(null);
    }
  };

  const cardProps = useMemo(() => {
    return PLANS.map((plan) => {
      if (plan.tier === "free") {
        return { plan, url: isAuthed ? "/dashboard" : "/register" };
      }
      if (!isAuthed) {
        return { plan, url: "/login?returnTo=/plans" };
      }
      return {
        plan,
        url: undefined as string | undefined,
        clickHandler: (e: FormEvent) => startCheckout(e, plan),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  return (
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

        {error && (
          <Grid item xs={12} sx={{ width: "100%", maxWidth: 720 }}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

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
          {cardProps.map(({ plan, url, clickHandler }, index) => {
            const busy = busyTier === plan.tier;
            return (
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
                  buttonDisabled={plan.buttonDisabled || busy}
                  buttonText={busy ? "Redirecting…" : plan.buttonText}
                  url={url}
                  clickHandler={clickHandler}
                />
              </Grid>
            );
          })}
        </Grid>
      </Grid>
    </Box>
  );
};

export default PlanPage;
