import { AccountService } from '@/services/accountService';
import { StripeService } from '@/services/stripeService';
import { UserService } from '@/services/userService';
import { routeRedirect, toResponse } from '@/utils/routing-utils';

export async function POST(request: Request) {
  console.log('backend request: /checkout-success')

  const data = await request.json();

  const sessionID = data?.context?.searchParams?.session_id;
  
  const userSub = data?.subID?.value;
  
  const userService = new UserService();
  const accountService = new AccountService();

  const currentUser = await userService.getUser(userSub);
  console.log('current user', currentUser);

  if (currentUser?.found === false) {
    console.error('user not found: this URL should not be accessed');
    return routeRedirect('/')
  }

  const userId = currentUser?.id;
  const authID = currentUser?.authID;
  if (userId === undefined || authID === undefined) {
    console.error('user id or auth id missing');
    return routeRedirect('/');
  }

  const userForAccount = { ...currentUser, id: userId, authID };

  //check account exists otherwise update account
  const account = await accountService.getAccount('userID', userId);

  if (account?.found === false || account?.stripeSubscriptionID === 'NULL') {
    console.log('no account found');
    if (!sessionID) {
      console.error('missing Stripe session id');
      return toResponse({ error: 'your account could not be created' });
    }
    return await createAccount(sessionID, userForAccount);
  } else {
    console.log('account found re-activating');
    //return await updateAccount(sessionID, account);
  }
}

const createAccount = async (sessionID: string, currentUser: any) => {
  console.log('creating Account', currentUser)

  const stripeService = new StripeService();
  const accountService = new AccountService();

  const stripeSession = await stripeService.getSession(sessionID);
  const stripeSubId = stripeSession.stripeSubscriptionID;
  if (!stripeSubId) {
    console.error('stripe session missing subscription id');
    return toResponse({ error: 'your account could not be created' });
  }
  const stripeSubscription = await stripeService.getSubscription(stripeSubId);

  const newAccount = {
    userID: currentUser.id,
    authID: currentUser.authID,
    stripeCustomerID: stripeSession.stripeCustomerID,
    stripeSubscriptionID: stripeSubId,
    stripePriceID: stripeSubscription.priceID,
    stripeProductID: stripeSubscription.productID,
    planName: stripeSubscription.planName,
    status: 'ACTIVE'
  };

  const account = await accountService.createAccount(newAccount);

  if (account?.id) {
    console.log('received account', account.id)
    return routeRedirect(`/dashboard?id=${currentUser.id}`);
  }
  
  console.error('account not created');

  return toResponse({ 
    error: 'your account could not be created' 
  });
}


