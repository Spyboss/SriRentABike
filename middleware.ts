import { NextResponse } from 'next/server'
export default function middleware(req: any) {
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  const tokenCookie = req.cookies.get('__Secure-next-auth.session-token')?.value || req.cookies.get('next-auth.session-token')?.value
  if (isAdminRoute && !tokenCookie) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ['/admin/:path*']
}