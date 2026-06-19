import Image from "next/image"
import Link from "next/link"
import { Calendar, Users, ArrowRight, UserPlus, Megaphone, MapPin, Clock } from "lucide-react"
import prisma from "@/lib/prisma"

export const revalidate = 60 // Revalidate every minute

const formatDateThai = (dateStr: string | Date) => {
  const date = new Date(dateStr)
  const day = date.getDate()
  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ]
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear() + 543
  return `วันที่ ${day} ${month} พ.ศ. ${year}`
}

export default async function Home() {
  const projects = await prisma.project.findMany({
    where: { isPublished: true },
    orderBy: { startDate: 'asc' },
    include: {
      quotas: {
        orderBy: { grade: 'asc' }
      },
      registrations: {
        where: {
          status: {
            in: ['APPROVED', 'WAITLISTED']
          }
        },
        include: {
          studentProfile: true
        }
      }
    }
  })

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-slate-800 text-xl tracking-tight">ระบบลงทะเบียนกิจกรรม</span>
          </div>
          <nav>
            <Link href="/admin/login" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              เข้าสู่ระบบแอดมิน
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
            ค้นหาและสมัครเข้าร่วม <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">กิจกรรมของโรงเรียน</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            ดูค่าย ชมรม และกิจกรรมต่างๆ ที่กำลังจะมาถึง จองที่นั่งได้ง่ายๆ ด้วยอีเมลของโรงเรียน — เช็คสถานะการสมัครและประกาศผลได้ที่นี่
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-lg font-medium text-slate-700">ยังไม่มีกิจกรรมที่เปิดรับสมัคร</p>
              <p className="text-sm mt-1">โปรดกลับมาตรวจสอบใหม่ในภายหลัง!</p>
            </div>
          ) : (
            projects.map(project => {
              const totalCapacity = project.quotas.reduce((sum, q) => sum + q.capacity, 0)
              const totalRegistered = project.registrations.length
              
              const isAnnouncementAvailable = project.isAnnouncementOpen && 
                (!project.announcementStartDate || new Date() >= project.announcementStartDate) &&
                (!project.announcementEndDate || new Date() <= project.announcementEndDate)

              return (
              <div key={project.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-100 transition-all duration-300 group flex flex-col transform hover:-translate-y-1">
                <div className="h-48 bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-6 border-b border-slate-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-slate-100/[0.2] bg-[size:20px_20px]"></div>
                  <h3 className="text-2xl font-bold text-slate-800 text-center line-clamp-3 relative z-10 group-hover:text-indigo-700 transition-colors">
                    {project.title}
                  </h3>
                </div>
                <div className="p-6 flex-1 flex flex-col bg-white">
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {project.description || "เข้าร่วมกิจกรรมที่น่าตื่นเต้นนี้! คลิกเพื่อดูรายละเอียดเพิ่มเติมและสมัคร"}
                  </p>
                  
                  {/* Badges for grades */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.quotas.map(quota => (
                      <span key={quota.id} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        รับ ม.{quota.grade}
                      </span>
                    ))}
                  </div>
                  
                  <div className="space-y-3 mb-8 bg-slate-50 p-4 rounded-xl flex-1">
                    <div className="flex items-center text-sm font-medium text-slate-700 gap-3 pb-3 border-b border-slate-200">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span>เริ่มลงทะเบียน: {formatDateThai(project.startDate)}</span>
                        <span>ปิดลงทะเบียน: {formatDateThai(project.endDate)}</span>
                      </div>
                    </div>

                    {(project.activityDate || project.activityLocation) && (
                      <div className="flex flex-col gap-2 pb-3 border-b border-slate-200">
                        {(project.activityDate || project.activityTime) && (
                          <div className="flex items-start text-sm font-medium text-slate-700 gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                              <Clock className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col justify-center gap-1 min-h-[2rem]">
                              {project.activityDate && <span>วันติว: {project.activityDate}</span>}
                              {project.activityTime && <span>เวลา: {project.activityTime}</span>}
                            </div>
                          </div>
                        )}
                        {project.activityLocation && (
                          <div className="flex items-start text-sm font-medium text-slate-700 gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col justify-center min-h-[2rem]">
                              <span>สถานที่: {project.activityLocation}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="pt-1">
                      <div className="flex items-center text-sm font-semibold text-slate-800 mb-2">
                        <UserPlus className="w-4 h-4 mr-2 text-violet-600" />
                        ยอดสมัครรวม: {totalRegistered} / {totalCapacity} คน
                      </div>
                      <div className="space-y-1.5 pl-6">
                        {project.quotas.map(quota => {
                          const gradeRegistered = project.registrations.filter(r => r.studentProfile.grade === quota.grade).length
                          const isFull = gradeRegistered >= quota.capacity
                          
                          return (
                            <div key={quota.id} className="flex justify-between text-xs text-slate-600">
                              <span>ม.{quota.grade}</span>
                              <span className={isFull ? "text-amber-600 font-medium" : ""}>
                                {gradeRegistered} / {quota.capacity} {isFull && "(เต็ม)"}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-auto">
                    {isAnnouncementAvailable && (
                      <Link 
                        href={`/announcement/${project.id}`}
                        className="flex items-center justify-center gap-2 w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm hover:shadow"
                      >
                        <Megaphone className="w-4 h-4" />
                        ดูประกาศรายชื่อผู้มีสิทธิ์
                      </Link>
                    )}
                    <Link 
                      href={`/detail/${project.id}`}
                      className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow group-hover:bg-indigo-700"
                    >
                      ดูรายละเอียดและสมัคร
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
