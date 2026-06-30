"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, ArrowRight, UserPlus, Megaphone, MapPin, Clock, Search, Users, X, ZoomIn } from "lucide-react"
import { ProjectGridItem } from "@/app/types"
import { formatThaiDateWithDay, formatTimeRange } from "@/lib/dateUtils"

export default function ProjectGrid({ projects }: { projects: ProjectGridItem[] }) {
  const [search, setSearch] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const formatDateThai = (dateStr: string | Date) => {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ""
    try {
      const datePart = new Intl.DateTimeFormat('th-TH', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date)
      
      const timePart = new Intl.DateTimeFormat('th-TH', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date)

      return `${datePart} เวลา ${timePart} น.`
    } catch (e) {
      return ""
    }
  }

  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(search.toLowerCase()) || 
    (project.description && project.description.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div className="max-w-2xl mx-auto mb-8 sm:mb-12 px-4 sm:px-0">
        <div 
          className="relative w-full overflow-hidden rounded-2xl shadow-lg border border-slate-200 bg-white cursor-pointer group/banner"
          onClick={() => setSelectedImage("/schedule.jpg")}
        >
          <Image 
            src="/schedule.jpg" 
            alt="ตารางกำหนดการลงทะเบียนกิจกรรม โรงเรียนภูเขียว" 
            width={1200}
            height={630}
            priority={true}
            sizes="(max-width: 768px) 100vw, 800px"
            className="w-full h-auto object-cover group-hover/banner:scale-[1.02] transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/banner:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
            <div className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center font-medium shadow-xl">
              <ZoomIn className="w-5 h-5 mr-2" />
              คลิกเพื่อดูรูปเต็ม
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mb-10 sm:mb-16 px-4 sm:px-0">
        <div className="relative group">
          <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-xl group-hover:bg-indigo-500/10 transition-colors duration-500"></div>
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors w-6 h-6 z-10" />
          <input 
            type="text" 
            aria-label="ค้นหาโครงการ ค่าย หรือกิจกรรม"
            placeholder="ค้นหาโครงการ, ค่าย, หรือกิจกรรม..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="relative w-full pl-14 pr-6 py-4 sm:py-5 rounded-2xl border-2 border-slate-200 hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all text-slate-900 bg-white shadow-lg text-base sm:text-lg font-medium placeholder:font-normal"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-700">ไม่พบโครงการที่ค้นหา</p>
            <p className="text-sm mt-1">ลองใช้คำค้นหาอื่นดูอีกครั้ง</p>
          </div>
        ) : (
          filteredProjects.map(project => {
            const totalCapacity = project.quotas.reduce((sum, q) => sum + q.capacity, 0)
            const totalRegistered = project.registrations.length
            
            const isPastEndDate = project.registrationEndDate && new Date() > new Date(project.registrationEndDate)
            const isManuallyClosed = !project.isRegistrationOpen && (!project.registrationStartDate || new Date() >= new Date(project.registrationStartDate))
            const isRegistrationAvailable = !isPastEndDate && !isManuallyClosed

            const isAnnouncementAvailable = project.isAnnouncementOpen && 
              (!project.announcementStartDate || new Date() >= new Date(project.announcementStartDate)) &&
              (!project.announcementEndDate || new Date() <= new Date(project.announcementEndDate))

            return (
            <div key={project.id} className="bg-white sm:rounded-2xl sm:shadow-sm border-y sm:border border-slate-200 overflow-hidden flex flex-col">
              {project.posterUrl ? (
                <div 
                  className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 border-b border-slate-100 cursor-pointer group/img"
                  onClick={() => project.posterUrl && setSelectedImage(project.posterUrl)}
                >
                  <Image src={project.posterUrl} alt={project.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover group-hover/img:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent pointer-events-none"></div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none z-10">
                    <div className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center font-medium shadow-xl transform translate-y-4 group-hover/img:translate-y-0 transition-transform duration-300">
                      <ZoomIn className="w-5 h-5 mr-2" />
                      คลิกเพื่อดูรูปเต็ม
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900/90 to-transparent pointer-events-none z-0">
                    <p className="text-lg font-medium text-white/90 line-clamp-2 drop-shadow-md">
                      {project.description || "เข้าร่วมกิจกรรมที่น่าตื่นเต้นนี้!"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-6 border-b border-slate-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-slate-100/[0.2] bg-[size:20px_20px]"></div>
                  <p className="text-lg font-medium text-slate-700 text-center line-clamp-3 relative z-10">
                    {project.description || "เข้าร่วมกิจกรรมที่น่าตื่นเต้นนี้!"}
                  </p>
                </div>
              )}
              <div className="p-6 flex-1 flex flex-col bg-white">
                <h3 className="text-xl font-bold text-slate-800 mb-4 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                  {project.title}
                </h3>
                
                {/* Badges for grades */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.quotas.map((quota) => (
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>เริ่มลงทะเบียน: {formatDateThai(project.registrationStartDate || project.startDate)}</span>
                        {project.registrationStartDate && new Date(project.registrationStartDate) > new Date() && (
                          <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold">
                            อีก {Math.ceil((new Date(project.registrationStartDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} วัน
                          </span>
                        )}
                      </div>
                      {project.registrationEndDate && (
                        <span>ปิดลงทะเบียน: {formatDateThai(project.registrationEndDate)}</span>
                      )}
                    </div>
                  </div>

                  {(project.activityDate || project.activityLocation) && (
                    <div className="flex flex-col gap-2 pb-3 border-b border-slate-200">
                      {(project.activityDate || project.activityStartTime || project.activityEndTime) && (
                        <div className="flex items-start text-sm font-medium text-slate-700 gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col justify-center gap-1 min-h-[2rem]">
                            {project.activityDate && <span>วันติว: {formatThaiDateWithDay(project.activityDate)}</span>}
                            {(project.activityStartTime || project.activityEndTime) && <span>เวลา: {formatTimeRange(project.activityStartTime, project.activityEndTime)}</span>}
                          </div>
                        </div>
                      )}
                      {project.activityLocation && (
                        <div className="flex items-start text-sm font-medium text-slate-700 gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col justify-center gap-1 min-h-[2rem]">
                            <span>สถานที่: {project.activityLocation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span className="flex items-center text-indigo-600">
                        <Users className="w-4 h-4 mr-1.5" />
                        ยอดสมัครรวม
                      </span>
                      <span>{totalRegistered} / {totalCapacity} คน</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          totalRegistered >= totalCapacity ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                        }`}
                        style={{ width: `${totalCapacity > 0 ? Math.min(100, (totalRegistered / totalCapacity) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                  {isRegistrationAvailable && (
                    <Link 
                      href={`/detail/${project.id}`}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-3.5 px-4 rounded-xl text-center transition-all duration-300 shadow-md hover:shadow-indigo-500/25 flex items-center justify-center group/btn"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      รายละเอียดและลงทะเบียน
                      <ArrowRight className="w-4 h-4 ml-2 transform group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  )}

                  {isAnnouncementAvailable && (
                    <Link
                      href={`/announcement/${project.id}`}
                      className="flex-1 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200 hover:border-emerald-300 font-semibold py-2.5 px-4 rounded-xl text-center text-sm transition-all duration-300 shadow-xs flex items-center justify-center group/ann"
                    >
                      <Megaphone className="w-4 h-4 mr-2 text-emerald-500" />
                      ดูประกาศรายชื่อ
                      <ArrowRight className="w-4 h-4 ml-2 transform group-hover/ann:translate-x-1 transition-transform opacity-0 group-hover/ann:opacity-100" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
            )
          })
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-900/90 backdrop-blur-sm cursor-pointer animate-in fade-in duration-200" 
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl w-full max-h-full flex justify-center items-center animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button 
              aria-label="ปิดหน้าต่างรูปภาพ"
              className="absolute -top-12 right-0 sm:-right-12 sm:top-0 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={selectedImage} 
              alt="Full Size" 
              className="max-w-full max-h-[85vh] sm:max-h-[90vh] object-contain rounded-2xl shadow-2xl" 
            />
          </div>
        </div>
      )}
    </div>
  )
}
