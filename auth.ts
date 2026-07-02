import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import prisma from "@/lib/prisma"
import { headers } from "next/headers"

import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const emailAttempt = user.email

        if (!emailAttempt) return false

        let ip = null
        let userAgent = null
        try {
          const hdrs = await headers()
          ip = hdrs.get('x-forwarded-for') || '127.0.0.1'
          userAgent = hdrs.get('user-agent') || 'Unknown'
        } catch (e) {}

        try {
          // Check Admin
          const adminUser = await prisma.adminUser.findUnique({
            where: { email: emailAttempt },
          })

          if (adminUser) {
            await prisma.adminLoginLog.create({
              data: { emailAttempt, status: 'SUCCESS', ipAddress: ip, userAgent },
            })
            return true
          }

          // Check Student
          const studentProfile = await prisma.studentProfile.findUnique({
            where: { email: emailAttempt }
          })

          if (studentProfile) {
            return true
          }

          // Neither Admin nor Student
          await prisma.adminLoginLog.create({
            data: { 
              emailAttempt, 
              status: 'FAILED', 
              failureReason: 'อีเมลไม่พบในระบบผู้ดูแลหรือนักเรียน',
              ipAddress: ip, 
              userAgent 
            },
          })
          return false
        } catch (error) {
          console.error("Error checking user:", error)
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
        } else {
          const studentProfile = await prisma.studentProfile.findUnique({
            where: { email: session.user.email }
          })
          if (studentProfile) {
            (session.user as any).role = 'STUDENT';
            (session.user as any).studentId = studentProfile.studentId;
          }
        }
      }
      return session;
    }
  }
})
