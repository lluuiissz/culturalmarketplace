import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

export async function POST(request: Request) {
  await destroySession();
  // Native form submissions (header Log out button) expect a redirect;
  // fetch() callers expect JSON.
  if (request.headers.get('accept')?.includes('text/html')) {
    return NextResponse.redirect(new URL('/', request.url), 303);
  }
  return NextResponse.json({ status: 'success', redirect: '/' });
}
