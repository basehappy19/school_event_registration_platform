import Link from "next/link"
import { CheckCircle2, Clock, ArrowLeft, User, Calendar, Hash, BookOpen, AlertCircle } from "lucide-react"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import CancelRegistrationButton from "../components/CancelRegistrationButton"
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
    title: `ลงทะเบียนสำเร็จ - ${project.title}`,
    description: `รายละเอียดการลงทะเบียนโครงการ${project.title}`
  }
}

export default async function SuccessPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ id: string }>,
  searchParams?: Promise<{ studentId?: string }>
}) {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const targetStudentId = resolvedSearchParams.studentId

  const numericId = parseInt(id, 10)
  if (isNaN(numericId)) redirect("/")

  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"

  let profile = null

  if (session?.user?.email) {
    const userProfile = await prisma.studentProfile.findUnique({
      where: { email: session.user.email }
    })

    if (targetStudentId) {
      if (isAdmin) {
        profile = await prisma.studentProfile.findUnique({
          where: { studentId: targetStudentId }
        })
      } else if (userProfile && userProfile.studentId === targetStudentId) {
        profile = userProfile
      } else {
        redirect(`/detail/${numericId}`)
      }
    } else {
      profile = userProfile
    }
  } else if (isAdmin && targetStudentId) {
    profile = await prisma.studentProfile.findUnique({
      where: { studentId: targetStudentId }
    })
  }

  if (!profile) {
    redirect(`/detail/${numericId}`)
  }

  const registration = await prisma.registration.findFirst({
    where: {
      projectId: numericId,
      studentId: profile.studentId
    },
    include: {
      project: true,
      answers: {
        include: {
          field: true
        }
      }
    }
  })

  if (!registration) {
    redirect(`/detail/${numericId}`)
  }

  const isApproved = registration.status === "APPROVED"
  const isRejected = registration.status === "REJECTED"

  // Query queue numbers
  const totalQueueNumber = await prisma.registration.count({
    where: {
      projectId: numericId,
      status: { in: ['APPROVED', 'WAITLISTED'] },
      createdAt: { lte: registration.createdAt }
    }
  })

  const gradeQueueNumber = await prisma.registration.count({
    where: {
      projectId: numericId,
      studentProfile: { grade: profile.grade },
      status: { in: ['APPROVED', 'WAITLISTED'] },
      createdAt: { lte: registration.createdAt }
    }
  })

  const thaiDateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Bangkok'
  }
  const thaiTimeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Bangkok'
  }
  
  const regDate = new Date(registration.createdAt)
  const formattedDate = regDate.toLocaleDateString('th-TH', thaiDateOptions)
  const formattedTime = regDate.toLocaleTimeString('th-TH', thaiTimeOptions) + ' น.'

  return (
    <div className="min-h-screen bg-transparent font-sans flex flex-col items-center justify-center py-0 sm:py-12 px-0 sm:px-6 lg:px-8">
      <div className="bg-white sm:rounded-3xl sm:shadow-xl sm:border border-slate-100 px-5 py-8 sm:p-10 md:p-12 max-w-4xl w-full min-h-screen sm:min-h-0">
        <div className="text-center mb-8">
          {isApproved ? (
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-white">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          ) : isRejected ? (
            <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-white">
              <AlertCircle className="w-12 h-12" />
            </div>
          ) : (
            <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-white">
              <Clock className="w-12 h-12" />
            </div>
          )}

          <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
            {isApproved ? "การลงทะเบียนเสร็จสมบูรณ์" : isRejected ? "ไม่ได้รับสิทธิ์เข้าร่วมโครงการ" : "นักเรียนอยู่ในรายชื่อสำรอง"}
          </h1>
          
          <div className="text-slate-600 text-base sm:text-lg leading-relaxed">
            {isApproved ? (
              <div className="space-y-1.5 mt-2">
                <p>ระบบได้บันทึกข้อมูลการลงทะเบียนเรียบร้อยแล้ว</p>
                <p>นักเรียนได้รับสิทธิ์ในการเข้าร่วมโครงการ</p>
              </div>
            ) : isRejected ? (
              <p className="mt-2">เนื่องจากโควตารับลงทะเบียนเต็มแล้ว จึงไม่สามารถมอบสิทธิ์เข้าร่วมโครงการให้ได้ในครั้งนี้</p>
            ) : (
              <div className="space-y-1.5 mt-2">
                <p>ตอนนี้จำนวนที่นั่งเต็มแล้ว ระบบได้บันทึกรายชื่อไว้ในลำดับสำรอง</p>
                <p className="text-sm sm:text-base text-slate-500">หากมีผู้สละสิทธิ์หรือคุณครูอนุมัติเพิ่มเติม นักเรียนจะได้รับการเลื่อนลำดับโดยอัตโนมัติ</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-200 shadow-inner">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center border-b border-slate-200 pb-3">
            <BookOpen className="w-5 h-5 mr-3 text-indigo-600" />
            รายละเอียดการลงทะเบียน
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-500 mb-1 flex items-center">
                <User className="w-4 h-4 mr-2" /> ชื่อ-นามสกุล
              </p>
              <p className="font-semibold text-slate-900">{profile.prefix}{profile.firstName} {profile.lastName}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500 mb-1 flex items-center">
                <Hash className="w-4 h-4 mr-2" /> ระดับชั้นและเลขที่
              </p>
              <p className="font-semibold text-slate-900">ม.{profile.grade}/{profile.room} เลขที่ {profile.number}</p>
            </div>

            <div className="md:col-span-2 border-t border-slate-200 pt-4 mt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-1 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" /> วันที่และเวลาที่ลงทะเบียน
                </p>
                <p className="font-semibold text-slate-900">{formattedDate} เวลา {formattedTime}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-500 mb-1 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> สถานะการได้รับสิทธิ์
                </p>
                <p className={`font-semibold ${isApproved ? 'text-emerald-600' : isRejected ? 'text-rose-600' : 'text-amber-600'}`}>
                  {isApproved ? "ได้รับสิทธิ์ (ตัวจริง)" : isRejected ? "ไม่ได้รับสิทธิ์" : "รอเรียกสิทธิ์ (สำรอง)"}
                </p>
              </div>
            </div>

            {!isRejected && (
              <div className="md:col-span-2 border-t border-slate-200 pt-4 mt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1 flex items-center">
                    <Hash className="w-4 h-4 mr-2" /> ลำดับการลงทะเบียน (ในโครงการ)
                  </p>
                  <p className="font-semibold text-slate-900">
                    คนที่ {totalQueueNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1 flex items-center">
                    <Hash className="w-4 h-4 mr-2" /> ลำดับการลงทะเบียน (ระดับชั้น ม.{profile.grade})
                  </p>
                  <p className="font-semibold text-slate-900">
                    คนที่ {gradeQueueNumber}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Support Contact Card */}
        <div className="mt-8 mb-6 bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center shadow-2xs">
          <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-3.5">
            💬 มีข้อสงสัยหรือเจอปัญหาในการลงทะเบียน?
          </p>
          <a 
            href="https://www.instagram.com/base_happy19/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span>ทักได้เลย : @base_happy19</span>
          </a>
        </div>

        <div className="mb-4">
          <Link 
            href="/"
            className="flex items-center justify-center w-full bg-slate-900 hover:bg-black text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-slate-900/20"
          >
            <ArrowLeft className="w-5 h-5 mr-3" /> กลับสู่หน้าหลัก
          </Link>
        </div>

        {!isRejected && (
          <CancelRegistrationButton registrationId={registration.id} />
        )}
      </div>
    </div>
  )
}
