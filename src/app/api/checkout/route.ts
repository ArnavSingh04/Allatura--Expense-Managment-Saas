// app/checkout-sessions/route.ts
import { stripe } from "@/lib/stripe";
import { AccountService } from "@/services/accountService";
import { UserService } from "@/services/userService";
import { routeRedirect, toResponse } from "@/utils/routing-utils";
import { NextResponse } from "next/server";
import Stripe from "stripe";

// data needed for checkout
export interface CheckoutRequest {
  planID: string;
}

export async function GET(request: Request) {
  // if user has account redirect to dashboard
  // if user has no account return res ok

  const idTemp = request.url.split('/')
  const userID = idTemp[idTemp.length - 2].split('?')[1].split('=')[1]

  if (userID === 'null') {
    console.log('returning .....')
    return routeRedirect('/api/auth/login');
  }

  const accountService = new AccountService();
  const account = await accountService.getAccount('userID', userID);

  if( account !== undefined) {
    if (account?.found === false || account?.stripeSubscriptionID === 'NULL') {
      return toResponse({ status: 'ok' })
    } else if (account?.stripeSubscriptionID !== 'NULL') {
      console.log(account?.stripeSubscriptionID)
      return routeRedirect('/dashboard')
    }
  }

  return routeRedirect('/api/auth/login');
}

export async function POST(request: Request) {

  const data = await request.json();
  const planID = data?.planID;
  const userID = data?.userID;

  const userService = new UserService();
  const user = await userService.getUserByID(userID);

  const success_url = `${process.env.NEXT_PUBLIC_APP_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`;

  const checkoutSession: Stripe.Checkout.Session =
    await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        currency: 'USD',
        mode: "subscription",
        customer_email: user.email,
        line_items: [
          {
            price: planID,
            quantity: 1
          }
        ],
        consent_collection: {
          terms_of_service: 'required',
        },
        success_url: success_url,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans?id=${userID}`,
      }
    )

  return new NextResponse(
    JSON.stringify({ id: checkoutSession.id }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );

}