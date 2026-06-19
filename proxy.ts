import { NextResponse } from 'next/server'
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { Redis } from '@upstash/redis'

const { auth } = NextAuth(authConfig)

// Mock Redis initialization to prevent crashing if env vars are missing
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://mock-url.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'mock-token',
})

export default auth(async (req) => {
  const path = req.nextUrl.pathname
  const ip = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1'

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

  // If already logged in, don't allow accessing login page again
  // (Disabled to allow students to switch accounts on the login page)
  // if (isLoginRoute && req.auth) {
  //   return NextResponse.redirect(new URL('/admin', req.nextUrl.origin))
  // }

  // Redis logic only runs if env vars are configured properly
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      // 1. Brute Force Lockout Check
      const isBanned = await redis.get(`banned:${ip}`)
      if (isBanned) {
        return new NextResponse('Too Many Failed Attempts. IP Blocked.', { status: 429 })
      }

      // 2. Rate Limiting Check (Only on POST requests to prevent spam)
      if (req.method === 'POST') {
        const rateLimitKey = `ratelimit:${ip}`
        const requests = await redis.incr(rateLimitKey)
        
        if (requests === 1) {
          await redis.expire(rateLimitKey, 60) // 1 minute window
        }

        if (requests > 5) {
          return new NextResponse('Rate Limit Exceeded', { status: 429 })
        }
      }
    } catch (error) {
      console.error('Redis Error:', error)
      // Fail open if Redis fails
    }
  }

  return NextResponse.next()
})

// Specify matcher to avoid running middleware on static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
