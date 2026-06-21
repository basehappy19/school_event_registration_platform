import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import AdminDashboardClient from "./components/AdminDashboardClient"
import { Metadata } from "next"
import Image from "next/image"

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
      <nav className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={40} height={40} className="w-10 h-10 object-contain rounded-lg shadow-sm bg-white" />
          <span className="font-semibold text-lg tracking-tight">ผู้ดูแลระบบ</span>
        </div>
        <div className="flex items-center gap-4 text-sm bg-slate-800 py-1.5 px-3 rounded-xl border border-slate-700">
          <span className="opacity-80 hidden sm:inline-block">{session.user?.email}</span>
          <div className="w-px h-4 bg-slate-600 hidden sm:block"></div>
          <form action={async () => {
            "use server"
            const { signOut } = await import("@/auth")
            await signOut({ redirectTo: "/" })
          }}>
            <button type="submit" className="text-rose-400 hover:text-rose-300 font-medium transition-colors">ออกจากระบบ</button>
          </form>
        </div>
      </nav>
      
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <AdminDashboardClient initialProjects={projects} />
      </main>
    </>
  )
}
