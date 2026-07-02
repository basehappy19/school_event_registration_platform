import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import AdminLogsClient from "./components/AdminLogsClient"
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Home, LogOut, User, ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "บันทึกประวัติการทำงานระบบ (Logs)",
  description: "ประวัติการสมัคร การแก้ไข และการเข้าสู่ระบบ",
}

export default async function AdminLogsPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/admin/login")
  }

  const role = (session.user as { role?: string })?.role
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    redirect("/admin/login?error=AccessDenied")
  }

  const registrationLogs = await prisma.registrationLog.findMany({
    take: 200,
    orderBy: { createdAt: 'desc' }
  })

  const projectEditLogs = await prisma.projectEditLog.findMany({
    take: 200,
    orderBy: { createdAt: 'desc' }
  })

  const adminLoginLogs = await prisma.adminLoginLog.findMany({
    take: 200,
    orderBy: { createdAt: 'desc' }
  })

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Image src="/logo.png" alt="Logo" width={36} height={36} className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-sm shrink-0" />
            <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight truncate">บันทึกประวัติการทำงานระบบ</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link 
              href="/admin" 
              className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">กลับหน้าจัดการหลัก</span>
            </Link>

            <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="max-w-[150px] md:max-w-[200px] truncate">{session.user?.email}</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <AdminLogsClient 
          initialRegistrationLogs={registrationLogs}
          initialProjectEditLogs={projectEditLogs}
          initialAdminLoginLogs={adminLoginLogs}
        />
      </main>
    </>
  )
}
