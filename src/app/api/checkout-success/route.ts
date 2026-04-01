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

  //check account exists otherwise update account
  const account = await accountService.getAccount('userID', currentUser.id);

  if (account?.found === false || account?.stripeSubscriptionID === 'NULL') {
    console.log('no account found');
    return await createAccount(sessionID, currentUser);
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
  const stripeSubscription = await stripeService.getSubscription(stripeSession.stripeSubscriptionID);

  const newAccount = {
    userID: currentUser.id,
    authID: currentUser.authID,
    stripeCustomerID: stripeSession.stripeCustomerID,
    stripeSubscriptionID: stripeSession.stripeSubscriptionID,
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


