"use client"

import { useState } from "react"
import { updateProjectSettings } from "@/app/actions/admin"
import { Loader2, Save } from "lucide-react"

export default function AdminProjectSettings({ project }: { project: any }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: project.title || "",
    description: project.description || "",
    isPublished: project.isPublished,
    isRegistrationOpen: project.isRegistrationOpen,
    isAnnouncementOpen: project.isAnnouncementOpen,
    activityDate: project.activityDate || "",
    activityTime: project.activityTime || "",
    activityLocation: project.activityLocation || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    await updateProjectSettings(project.id, formData)
    setLoading(false)
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 mb-8">
        <div>
          <input 
            type="text" 
            name="title" 
            value={formData.title} 
            onChange={handleChange} 
            className="text-2xl font-bold text-slate-900 w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors px-1 py-0.5"
            placeholder="ชื่อโครงการ"
          />
        </div>
        <div>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            className="text-slate-500 w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors px-1 py-1 rounded-md resize-y min-h-[60px]"
            placeholder="รายละเอียดโครงการ"
          />
        </div>
      </div>

      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">การตั้งค่าโครงการ</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
          <input 
            type="checkbox" 
            name="isPublished"
            checked={formData.isPublished}
            onChange={handleChange}
            className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
          />
          <div>
            <span className="block font-medium text-slate-800">แสดงผลโครงการ</span>
            <span className="block text-xs text-slate-500 mt-0.5">ให้นักเรียนมองเห็นบนหน้าเว็บหลัก</span>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
          <input 
            type="checkbox" 
            name="isRegistrationOpen"
            checked={formData.isRegistrationOpen}
            onChange={handleChange}
            className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-600"
          />
          <div>
            <span className="block font-medium text-slate-800">เปิดรับสมัคร</span>
            <span className="block text-xs text-slate-500 mt-0.5">อนุญาตให้นักเรียนกดลงทะเบียนได้</span>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
          <input 
            type="checkbox" 
            name="isAnnouncementOpen"
            checked={formData.isAnnouncementOpen}
            onChange={handleChange}
            className="mt-1 w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-600"
          />
          <div>
            <span className="block font-medium text-slate-800">ประกาศรายชื่อ</span>
            <span className="block text-xs text-slate-500 mt-0.5">เปิดให้นักเรียนดูรายชื่อตัวจริง/สำรอง</span>
          </div>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">วันที่จัดกิจกรรม</label>
          <input 
            type="text"
            name="activityDate"
            value={formData.activityDate}
            onChange={handleChange}
            placeholder="เช่น 15 สิงหาคม 2569"
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">เวลาที่จัดกิจกรรม</label>
          <input 
            type="text"
            name="activityTime"
            value={formData.activityTime}
            onChange={handleChange}
            placeholder="เช่น 09:00 - 16:00 น."
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">สถานที่</label>
          <input 
            type="text"
            name="activityLocation"
            value={formData.activityLocation}
            onChange={handleChange}
            placeholder="เช่น หอประชุมใหญ่"
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave}
          disabled={loading}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  )
}
