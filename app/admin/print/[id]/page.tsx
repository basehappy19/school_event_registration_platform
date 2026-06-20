import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import AutoPrint from "@/app/announcement/[id]/components/AutoPrint"
import { Metadata } from "next"
import { Sarabun } from "next/font/google"
import { formatThaiDateWithDay } from "@/lib/dateUtils"

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
      <AutoPrint title={project.title} />
      <div id="print-content" className={`bg-white min-h-screen p-8 text-black print:p-0 ${sarabun.className}`}>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 15mm; size: A4 portrait; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
        table { 
          page-break-inside: auto; 
          border-collapse: separate !important; 
          border-spacing: 0 !important; 
          border-top: 1px solid black !important;
          border-left: 1px solid black !important;
        }
        tr { 
          break-inside: avoid !important; 
          page-break-inside: avoid !important; 
          page-break-after: auto; 
        }
        td, th { 
          border-bottom: 1px solid black !important; 
          border-right: 1px solid black !important;
          border-top: none !important;
          border-left: none !important;
          page-break-inside: avoid !important; 
          break-inside: avoid !important; 
        }
      `}} />
      <div className="max-w-4xl mx-auto print:max-w-none">
        {/* Header */}
        <div className="text-center mb-6 mt-8 print:mt-0">
          <h1 className="text-lg font-bold mb-3">ประกาศรายชื่อผู้มีสิทธิ์เข้าติวเสริม</h1>
          <h2 className="text-lg font-bold mb-4">{project.title}</h2>
          
          <p className="text-base">
            {formattedDate} เวลา {project.activityTime || "ยังไม่กำหนดเวลา"} ณ {project.activityLocation || "โรงเรียนภูเขียว"}
          </p>
        </div>

        {/* Content */}
        <div>
          <table className="w-full text-left text-base">
            <thead>
              <tr>
                <th className="px-2 py-1 w-16 align-middle">ลำดับ</th>
                <th className="px-2 py-1 w-24 align-middle">ชั้น/ห้อง</th>
                <th className="px-2 py-1 w-20 align-middle">เลขที่</th>
                <th className="px-2 py-1 align-middle">ชื่อ-นามสกุล</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length > 0 ? (
                registrations.map((reg, index) => (
                  <tr key={reg.id}>
                    <td className="px-2 py-1 align-middle">{index + 1}</td>
                    <td className="px-2 py-1 align-middle">ม.{reg.studentProfile.grade}/{reg.studentProfile.room}</td>
                    <td className="px-2 py-1 align-middle">{reg.studentProfile.number}</td>
                    <td className="px-2 py-1 align-middle">
                      {reg.studentProfile.prefix}{reg.studentProfile.firstName} {reg.studentProfile.lastName}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-2 py-4 align-middle text-center text-black">
                    ไม่พบรายชื่อ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  )
}
