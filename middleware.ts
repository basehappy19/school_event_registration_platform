import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { Ratelimit } from '@upstash/ratelimit'
import { redis } from '@/lib/redis'

// Initialize Upstash Rate Limit (5 requests per 1 minute)
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
})

export default auth(async (req) => {
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const path = req.nextUrl.pathname

  // 1. Rate Limiting & Brute-Force Lockout check for student registration endpoints
  if (path.startsWith('/api/register') || path === '/register') {
    // Check Brute Force Lockout
    const lockoutKey = `lockout_${ip}`
    const isLockedOut = await redis.get(lockoutKey)
    if (isLockedOut) {
      return NextResponse.json(
        { error: 'Your IP is temporarily blocked due to multiple failed validation attempts. Please try again later.' },
        { status: 403 }
      )
    }

    // Apply Rate Limit
    const { success } = await ratelimit.limit(`ratelimit_${ip}`)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      )
    }
  }

  // 2. Admin Route Protection
  const isAdminRoute = path.startsWith('/admin')
  const isLoginRoute = path === '/admin/login'

  if (isAdminRoute && !isLoginRoute) {
    if (!req.auth) {
      // Redirect unauthenticated users to admin login
      const newUrl = new URL('/admin/login', req.nextUrl.origin)
      return NextResponse.redirect(newUrl)
    }
  }

  // If already logged in, don't allow accessing login page again
  if (isLoginRoute && req.auth) {
    return NextResponse.redirect(new URL('/admin', req.nextUrl.origin))
  }

  return NextResponse.next()
})

// Specify matcher to avoid running middleware on static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
