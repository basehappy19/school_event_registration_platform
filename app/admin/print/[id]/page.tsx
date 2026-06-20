import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import AutoPrint from "@/app/announcement/[id]/components/AutoPrint"
import { Metadata } from "next"
import { Sarabun } from "next/font/google"
import { formatThaiDateWithDay, formatTimeRange } from "@/lib/dateUtils"

const sarabun = Sarabun({
  weight: ['400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
})

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
  const role = (session?.user as { role?: string })?.role
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

  registrations.sort((a, b) => {
    const sA = a.studentProfile;
    const sB = b.studentProfile;
    const gA = parseInt(sA.grade) || 0;
    const gB = parseInt(sB.grade) || 0;
    if (gA !== gB) return gA - gB;
    const rA = parseInt(sA.room) || 0;
    const rB = parseInt(sB.room) || 0;
    if (rA !== rB) return rA - rB;
    const nA = parseInt(sA.number) || 0;
    const nB = parseInt(sB.number) || 0;
    return nA - nB;
  });

  // Date is already a string like "15 สิงหาคม 2569", we format it with day
  const formattedDate = formatThaiDateWithDay(project.activityDate)

  return (
    <>
      <AutoPrint />
      <div id="print-content" className={`bg-white min-h-screen text-black print:p-0 ${sarabun.className}`}>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 15mm; size: A4 portrait; }
          thead { display: table-header-group; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid black; padding: 4px 8px; }
          tr { page-break-inside: avoid; }
        }
        /* Screen styles */
        table.screen-table { width: 100%; border-collapse: collapse; }
        table.screen-table th, table.screen-table td { border: 1px solid black; padding: 4px 8px; }
      `}} />
      
      <div className="p-8 print:p-0 max-w-4xl mx-auto print:max-w-none">
        <div className="text-center mb-6 mt-8 print:mt-0">
          <h1 className="text-lg font-bold mb-3">ประกาศรายชื่อผู้มีสิทธิ์เข้าติวเสริม</h1>
          <h2 className="text-lg font-bold mb-4">{project.title}</h2>
          
          <p className="text-base">
            {formattedDate} เวลา {formatTimeRange(project.activityStartTime, project.activityEndTime)} ณ {project.activityLocation || "โรงเรียนภูเขียว"}
          </p>
        </div>

        <table className="screen-table text-left">
          <thead className="bg-white">
            <tr>
              <th className="w-16 text-center">ลำดับ</th>
              <th className="w-24 text-center">ชั้น/ห้อง</th>
              <th className="w-20 text-center">เลขที่</th>
              <th>ชื่อ-นามสกุล</th>
            </tr>
          </thead>
          <tbody>
            {registrations.length > 0 ? (
              registrations.map((reg, index) => (
                <tr key={reg.id}>
                  <td className="text-center">{index + 1}</td>
                  <td className="text-center">ม.{reg.studentProfile.grade}/{reg.studentProfile.room}</td>
                  <td className="text-center">{reg.studentProfile.number}</td>
                  <td>
                    {reg.studentProfile.prefix}{reg.studentProfile.firstName} {reg.studentProfile.lastName}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-4">ไม่พบรายชื่อ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  )
}
