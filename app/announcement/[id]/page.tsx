import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Search, Filter, Printer, Download } from "lucide-react"
import AutoPrint from "./components/AutoPrint"
import { formatThaiDateWithDay } from "@/lib/dateUtils"
import { Metadata } from "next"
import { auth } from "@/auth"

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
    title: `ประกาศรายชื่อผู้มีสิทธิ์เข้าร่วมโครงการ${project.title}`,
    description: `ตรวจสอบรายชื่อผู้มีสิทธิ์เข้าร่วมโครงการ${project.title} โรงเรียนภูเขียว`
  }
}

export default async function AnnouncementPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ q?: string, grade?: string, room?: string }> }) {
  const { id } = await params
  const { q, grade, room } = await searchParams
  
  const numericId = parseInt(id, 10)
  if (isNaN(numericId)) return notFound()

  const project = await prisma.project.findUnique({
    where: { id: numericId },
    include: {
      quotas: true
    }
  })

  if (!project) return notFound()

  // Check if announcement is open
  const now = new Date()
  const isAnnouncementOpen = project.isAnnouncementOpen &&
    (!project.announcementStartDate || now >= project.announcementStartDate) &&
    (!project.announcementEndDate || now <= project.announcementEndDate)

  const session = await auth()
  const role = (session?.user as any)?.role
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"

  if (!isAnnouncementOpen && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg text-center max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-rose-600">ยังไม่ถึงเวลาประกาศผล</h1>
          <p className="text-slate-600 mb-8">โครงการนี้ยังไม่เปิดให้ดูประกาศรายชื่อ หรือหมดระยะเวลาการประกาศผลแล้ว</p>
          <Link href="/" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium inline-flex items-center hover:bg-black transition-colors shadow-md">
            <ArrowLeft className="w-4 h-4 mr-2" /> กลับหน้าหลัก
          </Link>
        </div>
      </div>
    )
  }

  // Fetch registrations
  const registrations = await prisma.registration.findMany({
    where: {
      projectId: numericId,
      status: { in: ['APPROVED', 'WAITLISTED'] },
      studentProfile: {
        ...(q ? {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { studentId: { contains: q } }
          ]
        } : {}),
        ...(grade ? { grade } : {}),
        ...(room ? { room } : {})
      }
    },
    include: {
      studentProfile: true
    },
    orderBy: [
      { status: 'asc' }, // APPROVED comes before WAITLISTED
      { studentProfile: { grade: 'asc' } },
      { studentProfile: { room: 'asc' } },
      { studentProfile: { number: 'asc' } }
    ]
  })

  const approvedList = registrations.filter(r => r.status === 'APPROVED')
  const waitlistedList = registrations.filter(r => r.status === 'WAITLISTED')

  // Get unique grades and rooms for filters
  const allRegs = await prisma.registration.findMany({
    where: { projectId: numericId, status: { in: ['APPROVED', 'WAITLISTED'] } },
    include: { studentProfile: true }
  })
  
  const uniqueGrades = Array.from(new Set(allRegs.map(r => r.studentProfile.grade))).sort()
  const uniqueRooms = Array.from(new Set(allRegs.map(r => r.studentProfile.room))).sort((a, b) => parseInt(a) - parseInt(b))

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-12">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="bg-emerald-700/50 hover:bg-emerald-700 border border-emerald-500/30 text-white px-4 py-2.5 rounded-xl flex items-center mb-6 text-sm font-medium transition-all w-fit print:hidden shadow-sm backdrop-blur-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> กลับหน้าหลัก
          </Link>
          
          <div className="text-center print:text-black">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">
              ประกาศรายชื่อผู้มีสิทธิ์เข้าร่วม
            </h1>
            <h2 className="text-xl md:text-2xl font-semibold mb-6">
              โครงการ {project.title}
            </h2>
            <div className="inline-block bg-white/20 backdrop-blur-sm px-6 py-3 rounded-2xl text-sm md:text-base border border-white/20 print:border-none print:bg-transparent print:text-black print:p-0">
              <p>{formatThaiDateWithDay(project.activityDate)} เวลา {project.activityTime || "__________"} ณ {project.activityLocation || "__________"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-0 sm:px-6 lg:px-8 -mt-12 relative z-10 print:mt-0 print:pt-4">
        {/* Filters Section - Hidden in Print */}
        <div className="bg-white sm:rounded-2xl shadow-sm border-y sm:border border-slate-200 p-4 sm:p-5 mb-6 print:hidden">
          <form className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">ค้นหารายชื่อ</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  name="q"
                  defaultValue={q}
                  placeholder="รหัสนักเรียน หรือ ชื่อ-นามสกุล..." 
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            
            <div className="w-full md:w-32">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">ระดับชั้น</label>
              <select name="grade" defaultValue={grade || ""} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">ทุกชั้น</option>
                {uniqueGrades.map(g => (
                  <option key={g} value={g}>ม.{g}</option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-32">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">ห้อง</label>
              <select name="room" defaultValue={room || ""} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">ทุกห้อง</option>
                {uniqueRooms.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="w-full md:w-auto bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors shrink-0">
              ค้นหา
            </button>
          </form>
        </div>

        {/* Content */}
        <div className="bg-white sm:rounded-3xl sm:shadow-sm border-y sm:border border-slate-200 overflow-hidden print:border-none print:shadow-none">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center print:hidden">
            <h3 className="font-bold text-lg text-slate-800">รายชื่อตัวจริง ({approvedList.length} คน)</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm sm:whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 print:bg-transparent">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 w-12 sm:w-16 text-center">ลำดับ</th>
                  <th className="px-2 sm:px-6 py-3 sm:py-4 text-center">ชั้น</th>
                  <th className="px-2 sm:px-6 py-3 sm:py-4 text-center">เลขที่</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4">ชื่อ - นามสกุล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvedList.length > 0 ? (
                  approvedList.map((reg, index) => (
                    <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 sm:px-6 py-3 text-center text-slate-500">{index + 1}</td>
                      <td className="px-2 sm:px-6 py-3 text-center text-slate-600">ม.{reg.studentProfile.grade}/{reg.studentProfile.room}</td>
                      <td className="px-2 sm:px-6 py-3 text-center text-slate-600">{reg.studentProfile.number}</td>
                      <td className="px-3 sm:px-6 py-3 text-slate-800 font-medium break-words">
                        {reg.studentProfile.prefix}{reg.studentProfile.firstName} {reg.studentProfile.lastName}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 sm:px-6 py-8 text-center text-slate-500">
                      ไม่พบรายชื่อ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {waitlistedList.length > 0 && (
          <div className="bg-white sm:rounded-3xl sm:shadow-sm border-y sm:border border-slate-200 overflow-hidden mt-8 print:hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center print:hidden">
              <h3 className="font-bold text-lg text-amber-700">รายชื่อสำรอง ({waitlistedList.length} คน)</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm sm:whitespace-nowrap">
                <thead className="bg-amber-50 text-amber-800 font-semibold border-b border-amber-100 print:bg-transparent print:text-black">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 w-12 sm:w-16 text-center">ลำดับ</th>
                    <th className="px-2 sm:px-6 py-3 sm:py-4 text-center">ชั้น</th>
                    <th className="px-2 sm:px-6 py-3 sm:py-4 text-center">เลขที่</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4">ชื่อ - นามสกุล</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {waitlistedList.map((reg, index) => (
                    <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 sm:px-6 py-3 text-center text-amber-600 font-medium">{index + 1}</td>
                      <td className="px-2 sm:px-6 py-3 text-center text-slate-600">ม.{reg.studentProfile.grade}/{reg.studentProfile.room}</td>
                      <td className="px-2 sm:px-6 py-3 text-center text-slate-600">{reg.studentProfile.number}</td>
                      <td className="px-3 sm:px-6 py-3 text-slate-800 font-medium break-words">
                        {reg.studentProfile.prefix}{reg.studentProfile.firstName} {reg.studentProfile.lastName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      <AutoPrint />
    </div>
  )
}
