import { NextRequest, NextResponse } from 'next/server';

const getSession = async (_req: NextRequest, _res: NextResponse) => ({
  session: { user: { sub: '123' } },
});

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('plutus_access_token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith('/test/middleware')) {
    console.log('------- Proxy --------');
    const response = new NextResponse();
    const session = await getSession(request, response);
    if (session !== null && session.session?.user?.sub) {
      console.log('user is valid', session.session.user.sub);
      return NextResponse.next();
    }
    console.log('user is not valid');
    return NextResponse.redirect(
      new URL('/api/auth/logout', process.env.NEXT_PUBLIC_APP_URL || request.url),
      { status: 308 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/test/middleware'],
};
