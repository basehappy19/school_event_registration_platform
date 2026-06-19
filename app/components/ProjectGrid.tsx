"use client"

import { useState } from "react"
import Link from "next/link"
import { Calendar, ArrowRight, UserPlus, Megaphone, MapPin, Clock, Search, Users } from "lucide-react"

export default function ProjectGrid({ projects, formatDateThai }: { projects: any[], formatDateThai: (date: string | Date) => string }) {
  const [search, setSearch] = useState("")

  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(search.toLowerCase()) || 
    (project.description && project.description.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="ค้นหาโครงการ, ค่าย, หรือกิจกรรม..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-slate-900 bg-white shadow-sm"
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
            const totalCapacity = project.quotas.reduce((sum: number, q: any) => sum + q.capacity, 0)
            const totalRegistered = project.registrations.length
            
            const isAnnouncementAvailable = project.isAnnouncementOpen && 
              (!project.announcementStartDate || new Date() >= new Date(project.announcementStartDate)) &&
              (!project.announcementEndDate || new Date() <= new Date(project.announcementEndDate))

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
                  {project.quotas.map((quota: any) => (
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
                          <div className="flex flex-col justify-center gap-1 min-h-[2rem]">
                            <span>สถานที่: {project.activityLocation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center text-sm font-medium text-slate-700 gap-3 pt-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <span>
                      ลงทะเบียนแล้ว {totalRegistered} คน
                    </span>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                  <Link 
                    href={`/detail/${project.id}`}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl text-center transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center group/btn"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    รายละเอียดและลงทะเบียน
                    <ArrowRight className="w-4 h-4 ml-2 transform group-hover/btn:translate-x-1 transition-transform" />
                  </Link>

                  {isAnnouncementAvailable && (
                    <Link
                      href={`/announcement/${project.id}`}
                      className="flex-1 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200 hover:border-emerald-300 font-semibold py-3 px-4 rounded-xl text-center transition-all duration-300 shadow-sm flex items-center justify-center group/ann"
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
    </div>
  )
}
