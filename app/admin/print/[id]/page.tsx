import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import AutoPrint from "@/app/announcement/[id]/components/AutoPrint"
import { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const numericId = parseInt(id, 10)
  if (isNaN(numericId)) return {}
  
  const project = await prisma.project.findUnique({
    where: { id: numericId },
    select: { title: true }
  })

  if (!project) return {}

  return {
    title: `พิมพ์ประกาศรายชื่อ - ${project.title}`,
  }
}

export default async function AdminPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const role = (session?.user as any)?.role
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"

  if (!isAdmin) {
    redirect("/admin/login")
  }

  const { id } = await params
  const numericId = parseInt(id, 10)
  if (isNaN(numericId)) return notFound()

  const project = await prisma.project.findUnique({
    where: { id: numericId }
  })

  if (!project) return notFound()

  const registrations = await prisma.registration.findMany({
    where: {
      projectId: numericId,
      status: 'APPROVED'
    },
    include: {
      studentProfile: true
    },
    orderBy: [
      { studentProfile: { grade: 'asc' } },
      { studentProfile: { room: 'asc' } },
      { studentProfile: { number: 'asc' } }
    ]
  })

  // Format date
  const formattedDate = project.activityDate 
    ? new Date(project.activityDate).toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : "ยังไม่กำหนดวัน"

  return (
    <div className="bg-white min-h-screen p-8 text-slate-800 print:p-0">
      <div className="max-w-4xl mx-auto print:max-w-none">
        {/* Header */}
        <div className="text-center mb-12 mt-12 print:mt-0">
          <h1 className="text-3xl font-bold mb-4">ประกาศรายชื่อผู้มีสิทธิ์เข้าร่วม</h1>
          <h2 className="text-2xl font-bold mb-6">โครงการ {project.title}</h2>
          
          <p className="text-slate-700">
            วัน{formattedDate} เวลา {project.activityTime || "ยังไม่กำหนดเวลา"} ณ {project.activityLocation || "โรงเรียนภูเขียว"}
          </p>
        </div>

        {/* Content */}
        <div>
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-16 text-center">ลำดับ</th>
                <th className="px-6 py-4 text-center">ชั้น</th>
                <th className="px-6 py-4 text-center">เลขที่</th>
                <th className="px-6 py-4">ชื่อ - นามสกุล</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registrations.length > 0 ? (
                registrations.map((reg, index) => (
                  <tr key={reg.id}>
                    <td className="px-6 py-3 text-center text-slate-500">{index + 1}</td>
                    <td className="px-6 py-3 text-center text-slate-600">ม.{reg.studentProfile.grade}/{reg.studentProfile.room}</td>
                    <td className="px-6 py-3 text-center text-slate-600">{reg.studentProfile.number}</td>
                    <td className="px-6 py-3 text-slate-800 font-medium">
                      {reg.studentProfile.prefix}{reg.studentProfile.firstName} {reg.studentProfile.lastName}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    ไม่พบรายชื่อ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <AutoPrint />
    </div>
  )
}
