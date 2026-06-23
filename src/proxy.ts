import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. Secure Administrative routes & API endpoints
  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isAdminApi = pathname.startsWith('/api/admin') && pathname !== '/api/admin/login' && pathname !== '/api/admin/logout';

  if (isAdminPage || isAdminApi) {
    const sessionToken = request.cookies.get('admin_session')?.value;
    const isValidSession = sessionToken ? await verifyToken(sessionToken) : null;

    if (!isValidSession) {
      if (isAdminPage) {
        // Redirect to admin login screen
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      } else {
        // Return 401 Unauthorized for API requests
        return new NextResponse(
          JSON.stringify({ success: false, error: 'Unauthorized admin access' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }

  // 2. Define main app domain
  const mainDomain = process.env.NEXT_PUBLIC_SITE_URL 
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host 
    : 'loobycard.com';

  // Define debug local domains
  const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  const isVercelDomain = host.endsWith('.vercel.app');

  // Check if target request is not the main domain and is not an API call
  if (
    host && 
    host !== mainDomain && 
    !isLocalhost && 
    !isVercelDomain &&
    !pathname.startsWith('/api')
  ) {
    // This is a custom domain request!
    // Rewrite requests to: /_domain/[domain]/[path]
    // e.g. thiepcuoi-locthu.com/ -> /_domain/thiepcuoi-locthu.com/
    url.pathname = `/_domain/${host}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

// Config to specify which paths should be intercepted by this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - assets (template assets like images/sounds)
     * - templates (static template preview files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|assets|templates|favicon.ico).*)',
  ],
};

