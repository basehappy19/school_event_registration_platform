import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Search, Calendar, Clock, MapPin } from "lucide-react"
import AutoPrint from "./components/AutoPrint"
import AnnouncementInteractive from "./components/AnnouncementInteractive"
import { formatThaiDateWithDay, formatTimeRange } from "@/lib/dateUtils"
import { Metadata } from "next"
import { formatExportFilename } from "@/lib/export"
import { auth } from "@/auth"
import { signInWithGoogleCustomRedirect } from "@/app/actions/auth"
import AppNavbar from "@/app/components/AppNavbar"
export const dynamic = 'force-dynamic'
export const revalidate = 0


export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  
  const project = await prisma.project.findUnique({
    where: { id },
    select: { title: true, description: true }
  })

  if (!project) return {}

  const printTitle = formatExportFilename(project.title, project.description, 'pdf').replace('.pdf', '')

  return {
    title: printTitle,
    description: `ตรวจสอบรายชื่อผู้มีสิทธิ์เข้าร่วมโครงการ${project.title} โรงเรียนภูเขียว`
  }
}

export default async function AnnouncementPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ q?: string, grade?: string, room?: string, from_login?: string }> }) {
  const { id } = await params
  const { q, grade, room, from_login } = await searchParams
  
  if (!id) return notFound()

  const project = await prisma.project.findUnique({
    where: { id },
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

  const isRegistrationOpen = project.isRegistrationOpen &&
    (!project.registrationStartDate || now >= project.registrationStartDate) &&
    (!project.registrationEndDate || now <= project.registrationEndDate)

  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"

  let userProfile = null
  let userRegistration = null

  if (session?.user?.email) {
    userProfile = await prisma.studentProfile.findUnique({
      where: { email: session.user.email }
    })
    if (userProfile) {
      userRegistration = await prisma.registration.findFirst({
        where: {
          projectId: id,
          studentId: userProfile.studentId,
          status: { not: 'CANCELLED' }
        }
      })
    }
  }

  if (from_login === "1" && userRegistration) {
    redirect(`/detail/${id}/success`)
  }

  if (!isAnnouncementOpen && !isAdmin) {
    return (
      <>
        <AppNavbar />
        <div className="min-h-screen flex flex-col items-center justify-center bg-transparent text-slate-800 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-lg text-center max-w-md w-full">
            <h1 className="text-2xl font-bold mb-4 text-rose-600">ยังไม่ถึงเวลาประกาศผล</h1>
            <p className="text-slate-600">โครงการนี้ยังไม่เปิดให้ดูประกาศรายชื่อ หรือหมดระยะเวลาการประกาศผลแล้ว</p>
          </div>
        </div>
      </>
    )
  }

  // Fetch all approved and waitlisted registrations directly in real-time
  const allRegs = await prisma.registration.findMany({
    where: { projectId: id, status: { in: ['APPROVED', 'WAITLISTED'] } },
    include: { studentProfile: true }
  })

  allRegs.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'APPROVED' ? -1 : 1;
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
  
  const uniqueGrades = Array.from(new Set(allRegs.map(r => r.studentProfile.grade))).sort()
  const uniqueRooms = Array.from(new Set(allRegs.map(r => r.studentProfile.room))).sort((a, b) => parseInt(a) - parseInt(b))

  return (
    <>
      <AppNavbar />
      <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-12">
        <div className="bg-white border-b border-slate-200 pt-8 pb-12 px-4 sm:px-6 lg:px-8 shadow-xs">
          <div className="max-w-5xl mx-auto">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 mb-3 border border-indigo-100">
                ประกาศรายชื่อผู้มีสิทธิ์เข้าร่วมโครงการ
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 max-w-4xl mx-auto leading-relaxed">
                {project.title}
              </h1>
              {project.description && (
                <p className="text-base md:text-lg font-medium text-slate-600 mb-6 max-w-2xl mx-auto whitespace-pre-wrap leading-relaxed">
                  {project.description}
                </p>
              )}
              <div className="inline-flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 bg-slate-100/90 px-5 py-4 rounded-2xl text-xs sm:text-sm md:text-base text-slate-700 font-medium border border-slate-200/80 print:border-none print:bg-transparent print:p-0 w-full sm:w-auto max-w-full">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{formatThaiDateWithDay(project.activityDate)}</span>
                </div>
                <span className="hidden sm:inline text-slate-300">•</span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>เวลา {formatTimeRange(project.activityStartTime, project.activityEndTime)}</span>
                </div>
                <span className="hidden sm:inline text-slate-300">•</span>
                <div className="flex items-center gap-2 text-center">
                  <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>ณ {project.activityLocation || "__________"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-10 print:mt-0 print:pt-4">
        {/* User CTA Banner */}
        {!session ? (
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 print:hidden">
            <div className="text-center md:text-left">
              <h3 className="font-bold text-base sm:text-lg md:text-xl mb-1 break-keep">ต้องการดูข้อมูลการลงทะเบียน หรือแจ้งสละสิทธิ์?</h3>
              <p className="text-indigo-100 text-xs sm:text-sm break-keep leading-relaxed">เข้าสู่ระบบด้วยบัญชี Google ของโรงเรียนเพื่อตรวจสอบสถานะ</p>
            </div>
            <form action={signInWithGoogleCustomRedirect.bind(null, `/announcement/${id}?from_login=1`)} className="shrink-0 w-full md:w-auto">
              <button type="submit" className="w-full md:w-auto bg-white text-slate-800 hover:bg-slate-50 font-bold px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-sm transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 border border-slate-100">
                <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 shrink-0"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                <span>เข้าสู่ระบบด้วย Google</span>
              </button>
            </form>
          </div>
        ) : userRegistration ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 print:hidden">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <h3 className="font-bold text-emerald-950 text-base sm:text-lg break-keep">คุณได้ลงทะเบียนในโครงการนี้แล้ว</h3>
              </div>
              <p className="text-emerald-700 text-xs sm:text-sm break-keep leading-relaxed">ตรวจสอบรายละเอียดข้อมูลที่ลงทะเบียนไว้ หรือดำเนินการแจ้งสละสิทธิ์ได้ที่นี้</p>
            </div>
            <Link href={`/detail/${id}/success`} className="w-full md:w-auto text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-sm transition-all shadow-sm shrink-0">
              ดูข้อมูลการลงทะเบียน / สละสิทธิ์
            </Link>
          </div>
        ) : !isRegistrationOpen ? (
          <div className="bg-slate-100 border border-slate-300 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 print:hidden">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                <h3 className="font-bold text-slate-800 text-base sm:text-lg break-keep">หมดเวลารับลงทะเบียนแล้ว</h3>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm break-keep leading-relaxed">คุณไม่ได้ลงทะเบียนเข้าร่วมโครงการนี้ในช่วงเวลาที่เปิดรับลงทะเบียน จึงไม่สามารถเข้าร่วมกิจกรรมได้</p>
            </div>
            <Link href={`/detail/${id}`} className="w-full md:w-auto text-center bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-sm transition-all shadow-2xs shrink-0">
              ดูรายละเอียดโครงการ
            </Link>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 print:hidden">
            <div className="text-center md:text-left">
              <h3 className="font-bold text-amber-950 text-base sm:text-lg mb-1 break-keep">คุณยังไม่ได้ลงทะเบียนในโครงการนี้</h3>
              <p className="text-amber-700 text-xs sm:text-sm break-keep leading-relaxed">หากต้องการเข้าร่วมกิจกรรม สามารถเข้าไปอ่านรายละเอียดและลงทะเบียนได้ที่หน้าฟอร์มลงทะเบียน</p>
            </div>
            <Link href={`/detail/${id}`} className="w-full md:w-auto text-center bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-sm transition-all shadow-sm shrink-0">
              ไปที่หน้าฟอร์มลงทะเบียน
            </Link>
          </div>
        )}
        {/* Interactive Filters and Table */}
        <AnnouncementInteractive 
          allRegistrations={allRegs}
          uniqueGrades={uniqueGrades} 
          uniqueRooms={uniqueRooms} 
          initialQ={q} 
          initialGrade={grade} 
          initialRoom={room} 
        />
      </div>
      
      <AutoPrint />
    </div>
    </>
  )
}
