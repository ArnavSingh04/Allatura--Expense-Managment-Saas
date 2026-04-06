import { redirect, RedirectType } from 'next/navigation';
import { cookies } from 'next/headers'
import { submitRequest } from '@/utils/api-utils';


export default async function CheckoutSuccessPage(context: any) {
  const cookieStore = await cookies();
  const subID = cookieStore.get('subID');

  const data = await submitRequest({context: context, subID: subID}, 'checkout-success').then((data: any) => {
    if( data?.redirectURL ) { return redirect(data.redirectURL, RedirectType.replace) }
    return data.error;
  })

 
  return (
    <>
      <h1>Creating your account...</h1>
      <h2>Please wait</h2>
      <h3> {data?.error? <>{data.error}</> : <></> } </h3>
    </>
  );
}

