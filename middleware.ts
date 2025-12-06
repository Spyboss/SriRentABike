import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
export default async function middleware(req: NextRequest) {
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  if (isAdminRoute) {
    const token = await getToken({ req })
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search)
      return NextResponse.redirect(url)
    }
  }
}

export const config = {
  matcher: ['/admin/:path*']
}
