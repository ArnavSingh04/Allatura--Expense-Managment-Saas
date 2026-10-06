"use client";

import { FormEvent, useMemo, useState } from "react";
import PlanCard from "@/components/plans/planCard";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import { PLANS, type PlanCardData } from "@/data/plans";
import { planCardRoot } from "@/styles/MaterialStyles/plan/planCardStyles";
import { useAuthSession } from "@/contexts/AuthSessionContext";
import { billingService } from "@/services/billingService";
import { ApiError } from "@/lib/api-client";
import MarketingNav from "@/components/marketing/MarketingNav";

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
    case "checkout_no_url":
    case "checkout_failed":
      return "Could not start checkout. Please try again.";
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
        // Sign in, then land on the billing page to complete the upgrade.
        return {
          plan,
          url: "/login?returnTo=/dashboard/settings/billing",
        };
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
      <MarketingNav />
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Box sx={{ textAlign: "center", maxWidth: 640, mx: "auto", mb: { xs: 4, md: 6 } }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: "1.9rem", md: "2.5rem" },
              fontWeight: 700,
              letterSpacing: "-0.03em",
              mb: 1.5,
            }}
          >
            Simple, transparent pricing
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            Start free and upgrade as your portfolio grows. Every plan includes the
            core commercial-control workflow: projects, contracts, and claims.
          </Typography>
        </Box>

        {error && (
          <Box sx={{ maxWidth: 720, mx: "auto", mb: 3 }}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        <Grid container spacing={3} justifyContent="center" alignItems="stretch">
          {cardProps.map(({ plan, url, clickHandler }, index) => {
            const busy = busyTier === plan.tier;
            return (
              <Grid
                key={`${plan.tier}-${index}`}
                size={{ xs: 12, sm: 10, md: 4 }}
                sx={{ display: "flex" }}
              >
                <PlanCard
                  cardSX={planCardRoot}
                  title={plan.title}
                  price={plan.price}
                  duration={plan.duration}
                  description={plan.description}
                  features={plan.features}
                  popular={plan.popular}
                  buttonDisabled={plan.buttonDisabled || busy}
                  buttonText={busy ? "Redirecting…" : plan.buttonText}
                  url={url}
                  clickHandler={clickHandler}
                />
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
};

export default PlanPage;
