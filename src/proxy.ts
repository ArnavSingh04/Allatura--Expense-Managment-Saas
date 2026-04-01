import { NextRequest, NextResponse } from 'next/server';

// Mock function just for testing
// Used to get the subscriber ID from an auth provider
const getSession = async (_req: NextRequest, _res: NextResponse) => ({
  session: { user: { sub: '123' } },
});

export async function proxy(request: NextRequest) {
  console.log('------- Proxy --------');

  const response = new NextResponse();
  const session = await getSession(request, response);

  if (session !== null && session.session?.user?.sub) {
    console.log('user is valid', session.session.user.sub);
    const nextResponse = NextResponse.next();
    // example: save the subscriber ID from the auth provider to cookies
    // nextResponse.cookies.set('subID', session.session.user.sub);
    return nextResponse;
  }

  console.log('user is not valid');
  return NextResponse.redirect(
    new URL('/api/auth/logout', process.env.NEXT_PUBLIC_APP_URL),
    { status: 308 }
  );
}

export const config = {
  matcher: ['/test/middleware'],
};