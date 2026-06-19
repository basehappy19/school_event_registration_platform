import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import prisma from "@/lib/prisma"

import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  trustHost: true,
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
          // Check Admin
          const adminUser = await prisma.adminUser.findUnique({
            where: { email: emailAttempt },
          })

          if (adminUser) {
            await prisma.adminLoginLog.create({
              data: { emailAttempt, status: 'SUCCESS' },
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
            data: { emailAttempt, status: 'FAILED' },
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
