import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import AdminDashboardClient from "./components/AdminDashboardClient"
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Home, LogOut, User, History } from "lucide-react"

export const metadata: Metadata = {
  title: "ระบบจัดการผู้ดูแลระบบ",
  description: "ระบบจัดการโครงการและผู้ลงทะเบียน",
}

export default async function AdminDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect("/admin/login")
  }

  const role = (session.user as { role?: string })?.role
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    redirect("/admin/login?error=AccessDenied")
  }

  // Fetch all projects for the selector
  const projects = await prisma.project.findMany({
    orderBy: [{ order: 'asc' }, { id: 'desc' }],
    include: {
      quotas: true,
      formFields: true,
      registrations: {
        include: {
          studentProfile: true,
          answers: true
        },
        orderBy: [
          { status: 'asc' },
          { createdAt: 'asc' }
        ]
      }
    }
  })

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Image src="/logo.png" alt="Logo" width={36} height={36} className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-sm shrink-0" />
            <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight truncate">ระบบจัดการผู้ดูแลระบบ</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link 
              href="/admin/logs" 
              className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-all shadow-sm"
              title="ดูประวัติการทำงานระบบ (Logs)"
            >
              <History className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">ประวัติระบบ (Logs)</span>
            </Link>

            <Link 
              href="/" 
              className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
              title="กลับหน้าหลัก"
            >
              <Home className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">กลับหน้าหลัก</span>
            </Link>

            <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="max-w-[150px] md:max-w-[200px] truncate">{session.user?.email}</span>
            </div>

            <form action={async () => {
              "use server"
              const { signOut } = await import("@/auth")
              await signOut({ redirectTo: "/" })
            }}>
              <button 
                type="submit" 
                className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-all shadow-sm active:scale-95"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <AdminDashboardClient initialProjects={projects} />
      </main>
    </>
  )
}
