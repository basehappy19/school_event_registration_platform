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
          
          <p className="text-slate-600 text-lg">
            {isApproved ? (
              <>ระบบได้บันทึกข้อมูลการลงทะเบียนของท่านเรียบร้อยแล้ว<br className="hidden sm:block" />ท่านได้รับสิทธิ์ในการเข้าร่วมโครงการ</>
            ) : isRejected ? (
              "เนื่องจากโควตารับสมัครเต็มแล้ว จึงไม่สามารถมอบสิทธิ์เข้าร่วมโครงการให้ได้ในครั้งนี้"
            ) : (
              "ตอนนี้จำนวนที่นั่งเต็มแล้ว ระบบได้บันทึกรายชื่อของนักเรียนไว้ในลำดับสำรอง หากมีผู้สละสิทธิ์ นักเรียนจะได้รับการเลื่อนลำดับโดยอัตโนมัติ หรือกรณีที่คุณครูอนุมัติให้เข้าติวได้"
            )}
          </p>
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

        <div className="mt-8 mb-6 text-center">
          <p className="text-slate-600 mb-3">หากมีข้อสงสัย ปัญหาต่าง ๆ สามารถทัก <br/>IG: base_happy19 มาได้เลย</p>
          <a href="https://www.instagram.com/base_happy19/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center text-pink-600 bg-pink-50 hover:bg-pink-100 font-medium px-4 py-2 rounded-lg transition-colors border border-pink-100">
            กดตรงนี้ @base_happy19
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
