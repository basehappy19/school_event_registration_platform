import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import AdminDashboardClient from "./components/AdminDashboardClient"

export default async function AdminDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect("/admin/login")
  }

  const role = (session.user as any)?.role
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    redirect("/")
  }

  // Fetch all projects for the selector
  const projects = await prisma.project.findMany({
    orderBy: { startDate: 'desc' },
    include: {
      quotas: true,
      registrations: {
        include: {
          studentProfile: true
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
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center font-bold text-white shadow-sm">S</div>
          <span className="font-semibold text-lg">พอร์ทัลผู้ดูแลระบบ (Admin)</span>
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
