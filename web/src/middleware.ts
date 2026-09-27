// Route middleware: JWT cookie guards for role-scoped areas + role-aware
// login redirects (replaces CodeIgniter auth filters). Public marketplace
// pages (/customer/browse, /cart, /checkout handled in-page) stay open.

import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

const GUARDS: Array<{ prefixes: string[]; roles: Array<'customer' | 'artisan' | 'admin'> }> = [
  { prefixes: ['/customer/account'], roles: ['customer'] },
  { prefixes: ['/artisan'], roles: ['artisan'] },
  { prefixes: ['/admin'], roles: ['admin'] },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  for (const g of GUARDS) {
    if (g.prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
      if (!session) {
        const url = new URL('/auth/login', req.url);
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
      }
      if (!g.roles.includes(session.role)) {
        const home = session.role === 'admin' ? '/admin/dashboard' : session.role === 'artisan' ? '/artisan/dashboard' : '/customer/account/dashboard';
        return NextResponse.redirect(new URL(home, req.url));
      }
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/customer/:path*', '/artisan/:path*', '/admin/:path*'],
};
