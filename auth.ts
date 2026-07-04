import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import prisma from "@/lib/prisma"
import { headers, cookies } from "next/headers"
import { getClientIp } from "@/lib/ip"

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
        let fromProjectText = ""
        try {
          const hdrs = await headers()
          ip = getClientIp(hdrs)
          userAgent = hdrs.get('user-agent') || 'Unknown'

          const cookieStore = await cookies()
          const returnUrl = cookieStore.get("auth_return_url")?.value || 
                            cookieStore.get("next-auth.callback-url")?.value || 
                            cookieStore.get("__Secure-next-auth.callback-url")?.value ||
                            cookieStore.get("authjs.callback-url")?.value ||
                            cookieStore.get("__Secure-authjs.callback-url")?.value ||
                            hdrs.get('referer') || ""
          
          const match = returnUrl.match(/\/(detail|announcement)\/(\d+)/)
          if (match) {
            const pageType = match[1] === 'detail' ? 'หน้าฟอร์ม' : 'หน้าประกาศผล'
            const projId = parseInt(match[2], 10)
            if (!isNaN(projId)) {
              const proj = await prisma.project.findUnique({
                where: { id: projId },
                select: { title: true, description: true }
              })
              if (proj) {
                const displayDetail = (proj.description?.trim() || proj.title).replace(/\r?\n|\r/g, ' ')
                fromProjectText = ` [เข้าจาก${pageType}: ${displayDetail}]`
              }
            }
          }
        } catch (e) {}

        try {
          // Check Admin
          const adminUser = await prisma.adminUser.findUnique({
            where: { email: emailAttempt },
          })

          if (adminUser) {
            await prisma.adminLoginLog.create({
              data: { 
                emailAttempt, 
                status: 'SUCCESS', 
                failureReason: "ADMIN: เข้าสู่ระบบผู้ดูแลระบบสำเร็จ",
                ipAddress: ip, 
                userAgent 
              },
            })
            return true
          }

          // Check Student
          const studentProfile = await prisma.studentProfile.findUnique({
            where: { email: emailAttempt }
          })

          if (studentProfile) {
            await prisma.adminLoginLog.create({
              data: {
                emailAttempt,
                status: 'SUCCESS',
                failureReason: `STUDENT: เข้าสู่ระบบนักเรียน (${studentProfile.prefix}${studentProfile.firstName} ${studentProfile.lastName} รหัส: ${studentProfile.studentId} ม.${studentProfile.grade}/${studentProfile.room})${fromProjectText}`,
                ipAddress: ip,
                userAgent
              },
            })
            return true
          }

          // Neither Admin nor Student
          await prisma.adminLoginLog.create({
            data: { 
              emailAttempt, 
              status: 'FAILED', 
              failureReason: 'FAILED: อีเมลไม่พบในระบบผู้ดูแลหรือนักเรียน',
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
