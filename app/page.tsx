import Image from "next/image"
import Link from "next/link"
import prisma from "@/lib/prisma"
import ProjectGrid from "./components/ProjectGrid"
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
            โครงการติวเข้ม <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">เสริมความรู้มุ่งสู่มหาวิทยาลัย</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            ลงทะเบียนเข้าร่วมกิจกรรมติวเข้มกับวิทยากรผู้เชี่ยวชาญ เพื่อเตรียมความพร้อมสู่รั้วมหาวิทยาลัยที่คุณใฝ่ฝัน
          </p>
        </div>

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
                          const isFull = gradeRegistered === quota.capacity
                          const isOver = gradeRegistered > quota.capacity
                          
                          return (
                            <div key={quota.id} className="flex justify-between text-xs text-slate-600">
                              <span>ม.{quota.grade}</span>
                              <span className={isFull || isOver ? "text-amber-600 font-medium" : ""}>
                                {gradeRegistered} / {quota.capacity} {isFull && "(เต็ม)"} {isOver && "(เกิน)"}
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
