import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import prisma from "@/lib/prisma"

import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const emailAttempt = user.email

        if (!emailAttempt) return false

        try {
          const adminUser = await prisma.adminUser.findUnique({
            where: { email: emailAttempt },
          })

          const status = adminUser ? 'SUCCESS' : 'FAILED'

          // Write login attempt to log
          await prisma.adminLoginLog.create({
            data: {
              emailAttempt,
              status,
              // ipAddress and userAgent are typically gathered in route handlers; 
              // NextAuth beta doesn't provide them directly in callbacks without req.
            },
          })

          if (!adminUser) {
            return false // Deny access
          }

          return true
        } catch (error) {
          console.error("Error checking admin user:", error)
          return false
        }
      }
      return false
    },
    async session({ session }) {
      if (session.user?.email) {
        const adminUser = await prisma.adminUser.findUnique({
          where: { email: session.user.email }
        })
        if (adminUser) {
          (session.user as any).role = adminUser.role;
        }
      }
      return session;
    }
  }
})
