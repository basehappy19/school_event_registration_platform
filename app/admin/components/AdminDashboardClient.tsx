"use client"

import { useState, useEffect } from "react"
import { Calendar, Plus, Settings, Users, ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import AdminProjectSettings from "./AdminProjectSettings"
import AdminRegistrationList from "./AdminRegistrationList"
import AdminProjectStats from "./AdminProjectStats"
import { createProject } from "@/app/actions/admin"
import Link from "next/link"
import { ProjectWithRelations } from "@/app/types"

export default function AdminDashboardClient({ initialProjects }: { initialProjects: ProjectWithRelations[] }) {
  const router = useRouter()
  const projects = initialProjects
  const [activeProjectId, setActiveProjectId] = useState<number | null>(projects[0]?.id || null)
  const [isCreating, setIsCreating] = useState(false)

  const activeProject = projects.find(p => p.id === activeProjectId)

  const handleCreateProject = async () => {
    setIsCreating(true)
    const res = await createProject({
      title: "โครงการใหม่",
      description: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })
    setIsCreating(false)
    if (res.success) {
      router.refresh()
      if (res.project?.id) {
        setActiveProjectId(res.project.id)
      }
    } else {
      alert("Error: " + res.error)
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar: Project Selector */}
      <div className="w-full md:w-64 shrink-0 space-y-4">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" />
          กลับหน้าหลัก
        </Link>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">โครงการทั้งหมด</h2>
          <button 
            onClick={handleCreateProject}
            disabled={isCreating}
            className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 p-1.5 rounded-lg transition-colors"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="flex flex-col gap-2">
          {projects.length === 0 ? (
            <p className="text-sm text-slate-500 italic">ไม่มีโครงการ</p>
          ) : (
            projects.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveProjectId(p.id)}
                className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeProjectId === p.id 
                    ? "bg-indigo-600 text-white shadow-md" 
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <div className="line-clamp-2 leading-snug">{p.title}</div>
                <div className={`text-xs mt-1.5 flex items-center gap-1.5 ${activeProjectId === p.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${p.isPublished ? 'bg-emerald-400' : 'bg-slate-300'}`}></span>
                  {p.isPublished ? "เปิดเผยแพร่" : "ซ่อน"}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {!activeProject ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 flex flex-col items-center">
            <Calendar className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium">กรุณาเลือกโครงการจากเมนูด้านซ้าย</p>
            <p className="text-sm">หรือสร้างโครงการใหม่</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AdminProjectStats key={`stats-${activeProject.id}`} project={activeProject} />
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              {/* Settings Form Component (includes title and description edit) */}
              <AdminProjectSettings key={`settings-${activeProject.id}`} project={activeProject} />
            </div>

            {/* Registration Management Component */}
            <AdminRegistrationList key={`regs-${activeProject.id}`} project={activeProject} />
          </div>
        )}
      </div>
    </div>
  )
}
