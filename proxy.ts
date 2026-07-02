import { NextResponse } from 'next/server'
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { getClientIp } from './lib/ip'

const { auth } = NextAuth(authConfig)

export default auth(async (req) => {
  const path = req.nextUrl.pathname

  // Admin Route Protection
  const isAdminRoute = path.startsWith('/admin')
  const isLoginRoute = path === '/admin/login'

  if (isAdminRoute && !isLoginRoute) {
    if (!req.auth) {
      // Redirect unauthenticated users to admin login
      const newUrl = new URL('/admin/login', req.nextUrl.origin)
      return NextResponse.redirect(newUrl)
    }
  }

  return NextResponse.next()
})

// Specify matcher to avoid running middleware on static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
