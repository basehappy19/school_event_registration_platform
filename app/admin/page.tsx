import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import CommandCenter from "./components/CommandCenter"

export default async function AdminDashboard() {
  const session = await auth()
  
  if (!session) {
    redirect("/admin/login")
  }

  // Find the first active project for dashboard (In a real app, you might have a project selector)
  const project = await prisma.project.findFirst({
    where: { isPublished: true },
    include: {
      quotas: true
    }
  })

  if (!project) {
    return <div className="p-12 text-center text-slate-500">ไม่พบกิจกรรมที่เปิดรับสมัคร</div>
  }

  // Fetch registrations
  const rawRegistrations = await prisma.registration.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: 'desc' }
  })

  // Format quota stats
  const quotaStats = project.quotas.map(quota => {
    const approved = rawRegistrations.filter(r => r.grade === quota.grade && r.status === 'APPROVED').length
    const waitlisted = rawRegistrations.filter(r => r.grade === quota.grade && r.status === 'WAITLISTED').length
    return {
      grade: quota.grade,
      approved,
      waitlisted,
      capacity: quota.capacity
    }
  })

  // Format registrations for component
  const registrations = rawRegistrations.map(r => ({
    ...r,
    createdAt: r.createdAt
  }))

  return (
    <>
      <nav className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center font-bold text-white shadow-sm">S</div>
          <span className="font-semibold text-lg">พอร์ทัลผู้ดูแลระบบ (Admin)</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>{session.user?.email}</span>
          <form action={async () => {
            "use server"
            const { signOut } = await import("@/auth")
            await signOut({ redirectTo: "/" })
          }}>
            <button type="submit" className="text-slate-300 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg">ออกจากระบบ</button>
          </form>
        </div>
      </nav>
      <CommandCenter 
        registrations={registrations} 
        projectName={project.title} 
        quotaStats={quotaStats} 
        projectId={project.id}
      />
    </>
  )
}
