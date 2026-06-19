import Link from "next/link"
import { CheckCircle2, Clock, ArrowLeft, User, Calendar, Hash, Mail, BookOpen, FileText, LogOut } from "lucide-react"
import { auth } from "@/auth"
import { signOutAction } from "@/app/actions/auth"
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
}: { 
  params: Promise<{ id: string }>,
}) {
  const { id } = await params
  const numericId = parseInt(id, 10)
  if (isNaN(numericId)) redirect("/")

  const session = await auth()

  if (!session?.user?.email) {
    redirect(`/detail/${numericId}`)
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { email: session.user.email }
  })

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

  const thaiDateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  const thaiTimeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }
  
  const regDate = new Date(registration.createdAt)
  const formattedDate = regDate.toLocaleDateString('th-TH', thaiDateOptions)
  const formattedTime = regDate.toLocaleTimeString('th-TH', thaiTimeOptions) + ' น.'

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center justify-center py-0 sm:py-12 px-0 sm:px-6 lg:px-8">
      <div className="bg-white sm:rounded-3xl sm:shadow-xl sm:border border-slate-100 px-5 py-8 sm:p-8 max-w-2xl w-full min-h-screen sm:min-h-0">
        <div className="text-center mb-8">
          {isApproved ? (
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-white">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          ) : (
            <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-white">
              <Clock className="w-12 h-12" />
            </div>
          )}

          <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
            {isApproved ? "การลงทะเบียนเสร็จสมบูรณ์" : "นักเรียนอยู่ในรายชื่อสำรอง"}
          </h1>
          
          <p className="text-slate-600 text-lg">
            {isApproved 
              ? "ระบบได้บันทึกข้อมูลการลงทะเบียนของท่านเรียบร้อยแล้ว ท่านได้รับสิทธิ์ในการเข้าร่วมโครงการ" 
              : "ตอนนี้จำนวนที่นั่งเต็มแล้ว ระบบได้บันทึกรายชื่อของนักเรียนไว้ในลำดับสำรอง หากมีผู้สละสิทธิ์ นักเรียนจะได้รับการเลื่อนลำดับโดยอัตโนมัติ หรือกรณีที่คุณครูอนุมัติให้เข้าติวได้"}
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
                <Calendar className="w-4 h-4 mr-2" /> วันที่และเวลาที่ลงทะเบียน
              </p>
              <p className="font-semibold text-slate-900">{formattedDate} เวลา {formattedTime}</p>
            </div>
            
            <div>
              <p className="text-sm text-slate-500 mb-1 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2" /> สถานะการได้รับสิทธิ์
              </p>
              <p className={`font-semibold ${isApproved ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isApproved ? "ได้รับสิทธิ์ (ตัวจริง)" : "รอเรียกสิทธิ์ (สำรอง)"}
              </p>
            </div>

            <div className="md:col-span-2 border-t border-slate-200 pt-4 mt-2">
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

            {registration.answers && registration.answers.length > 0 && (
              <div className="md:col-span-2 border-t border-slate-200 pt-4 mt-2">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-indigo-500" /> ข้อมูลเพิ่มเติมที่กรอก
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {registration.answers.map(answer => (
                    <div key={answer.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <p className="text-xs text-slate-500 mb-1">{answer.field.label}</p>
                      <p className="font-medium text-sm text-slate-900 break-words whitespace-pre-wrap">
                        {answer.value || "-"}
                      </p>
                    </div>
                  ))}
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

        <Link 
          href="/"
          className="flex items-center justify-center w-full bg-slate-900 hover:bg-black text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-slate-900/20 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-3" /> กลับสู่หน้าหลัก
        </Link>

        <form action={signOutAction} className="w-full mb-4">
          <button type="submit" className="flex items-center justify-center w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 px-6 rounded-xl transition-all border border-slate-200 cursor-pointer">
            <LogOut className="w-5 h-5 mr-3" /> ออกจากระบบ
          </button>
        </form>

        <CancelRegistrationButton registrationId={registration.id} />
      </div>
    </div>
  )
}
