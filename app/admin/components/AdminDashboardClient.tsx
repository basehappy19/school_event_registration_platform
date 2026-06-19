"use client"

import { useState } from "react"
import { Calendar, Plus, Settings, Users } from "lucide-react"
import AdminProjectSettings from "./AdminProjectSettings"
import AdminRegistrationList from "./AdminRegistrationList"

export default function AdminDashboardClient({ initialProjects }: { initialProjects: any[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [activeProjectId, setActiveProjectId] = useState<number | null>(projects[0]?.id || null)

  const activeProject = projects.find(p => p.id === activeProjectId)

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar: Project Selector */}
      <div className="w-full md:w-64 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">โครงการทั้งหมด</h2>
          <button className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{activeProject.title}</h1>
              <p className="text-slate-500 mb-6">{activeProject.description || "ไม่มีรายละเอียด"}</p>
              
              {/* Settings Form Component */}
              <AdminProjectSettings project={activeProject} />
            </div>

            {/* Registration Management Component */}
            <AdminRegistrationList project={activeProject} />
          </div>
        )}
      </div>
    </div>
  )
}
