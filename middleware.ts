import {NextRequest, NextResponse} from 'next/server';

/**
 * Optional HTTP Basic authentication gate.
 *
 * Webapp talks to a single notes repository through a server-side token. Without
 * a gate, anyone who knows the URL of a deployment can read, write and delete
 * those notes. Set `APP_PASSWORD` to require a password before any route is
 * served. This is a stop-gap until per-user GitHub OAuth exists.
 *
 * When `APP_PASSWORD` is empty the middleware does nothing, which is what local
 * development needs.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function middleware(request: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  const username = process.env.APP_USERNAME || 'webapp';
  const header = request.headers.get('authorization');

  if (header?.startsWith('Basic ')) {
    let decoded = '';
    try {
      decoded = atob(header.slice(6));
    } catch {
      decoded = '';
    }
    const separator = decoded.indexOf(':');
    if (separator > 0) {
      const givenUser = decoded.slice(0, separator);
      const givenPassword = decoded.slice(separator + 1);
      if (safeEqual(givenUser, username) && safeEqual(givenPassword, password)) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Webapp", charset="UTF-8"',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export const config = {
  // Protect everything except Next.js build assets and public icons/fonts.
  matcher: ['/((?!_next/static|_next/image|icon.svg|favicon.svg|fonts/).*)'],
};
