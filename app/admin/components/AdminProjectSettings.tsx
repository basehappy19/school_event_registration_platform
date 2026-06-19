"use client"

import { useState } from "react"
import { updateProjectSettings, deleteProject } from "@/app/actions/admin"
import { Loader2, Save, CheckCircle2, Plus, Trash2, GripVertical, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { ProjectWithRelations } from "@/app/types"
import { FieldType, ProjectQuota } from "@prisma/client"

export default function AdminProjectSettings({ project }: { project: ProjectWithRelations }) {
  const router = useRouter()
  const [showToast, setShowToast] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: project.title || "",
    description: project.description || "",
    isPublished: project.isPublished,
    isRegistrationOpen: project.isRegistrationOpen,
    isAnnouncementOpen: project.isAnnouncementOpen,
    registrationStartDate: project.registrationStartDate ? new Date(project.registrationStartDate).toISOString().slice(0, 16) : "",
    registrationEndDate: project.registrationEndDate ? new Date(project.registrationEndDate).toISOString().slice(0, 16) : "",
    activityDate: project.activityDate || "",
    activityTime: project.activityTime || "",
    activityLocation: project.activityLocation || "",
  })

  // State for Quotas
  const [quotas, setQuotas] = useState<{grade: string, capacity: number}[]>(
    project.quotas?.length > 0 
      ? project.quotas.map((q) => ({ grade: q.grade, capacity: q.capacity }))
      : []
  )

  // State for Form Fields
  const [formFields, setFormFields] = useState<{id?: number, label: string, type: FieldType, options: string, isRequired: boolean}[]>(
    project.formFields?.length > 0
      ? project.formFields.map((f) => ({ id: f.id, label: f.label, type: f.type, options: f.options || "", isRequired: f.isRequired }))
      : []
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleGradeToggle = (grade: string) => {
    if (quotas.find(q => q.grade === grade)) {
      setQuotas(quotas.filter(q => q.grade !== grade))
    } else {
      setQuotas([...quotas, { grade, capacity: 0 }].sort((a, b) => Number(a.grade) - Number(b.grade)))
    }
  }

  const handleCapacityChange = (grade: string, capacity: number) => {
    setQuotas(quotas.map(q => q.grade === grade ? { ...q, capacity: isNaN(capacity) ? 0 : capacity } : q))
  }

  const addFormField = () => {
    setFormFields([...formFields, { label: "", type: "SHORT_TEXT", options: "", isRequired: false }])
  }

  const removeFormField = (index: number) => {
    if (!confirm("การลบคำถามจะทำให้คำตอบที่มีอยู่ถูกลบไปด้วย (ถ้ามี) คุณแน่ใจหรือไม่?")) return
    setFormFields(formFields.filter((_, i) => i !== index))
  }

  const updateFormField = (index: number, field: string, value: string | boolean | FieldType) => {
    const newFields = [...formFields]
    newFields[index] = { ...newFields[index], [field]: value }
    setFormFields(newFields)
  }

  const handleSave = async () => {
    setLoading(true)
    const payload: any = {
      ...formData,
      registrationStartDate: formData.registrationStartDate ? new Date(formData.registrationStartDate) : null,
      registrationEndDate: formData.registrationEndDate ? new Date(formData.registrationEndDate) : null,
      quotas,
      formFields
    }
    await updateProjectSettings(project.id, payload)
    setLoading(false)
    router.refresh()
    
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleDeleteProject = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบโครงการนี้? ข้อมูลทั้งหมด รวมถึงการลงทะเบียนจะถูกลบถาวร")) return
    setLoading(true)
    await deleteProject(project.id)
    router.push("/admin")
  }

  const totalCapacity = quotas.reduce((sum, q) => sum + (q.capacity || 0), 0)
  const grades = ["1", "2", "3", "4", "5", "6"]

  return (
    <div className="space-y-8">
      {showToast && (
        <div className="fixed top-6 right-6 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">บันทึกการตั้งค่าสำเร็จ</span>
        </div>
      )}

      {/* Header Info */}
      <div className="space-y-4">
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

      {/* General Settings */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">การตั้งค่าทั่วไป</h3>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">วัน/เวลา เปิดรับสมัคร</label>
            <input 
              type="datetime-local" 
              name="registrationStartDate"
              value={formData.registrationStartDate}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
            />
          </div>
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">วัน/เวลา ปิดรับสมัคร <span className="text-slate-400 font-normal">(ไม่บังคับ)</span></label>
            <input 
              type="datetime-local" 
              name="registrationEndDate"
              value={formData.registrationEndDate}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Activity Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">วันที่จัดกิจกรรม</label>
          <input 
            type="text"
            name="activityDate"
            value={formData.activityDate}
            onChange={handleChange}
            placeholder="เช่น 15 สิงหาคม 2569"
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
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
            className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Quotas Section */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">โควตารับสมัครแต่ละชั้น</h3>
          <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">รวมทั้งหมด {totalCapacity} คน</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {grades.map(grade => {
            const isSelected = quotas.some(q => q.grade === grade)
            const capacity = quotas.find(q => q.grade === grade)?.capacity || ""
            return (
              <div key={grade} className={`p-4 rounded-xl border ${isSelected ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-white'}`}>
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => handleGradeToggle(grade)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
                  />
                  <span className={`font-semibold ${isSelected ? 'text-indigo-700' : 'text-slate-600'}`}>ม.{grade}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    min="0"
                    disabled={!isSelected}
                    value={capacity}
                    onChange={(e) => handleCapacityChange(grade, parseInt(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-sm text-center disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    placeholder="จำนวน"
                  />
                  <span className="text-xs text-slate-500">คน</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Fields Section */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">คำถามเพิ่มเติม (Form Fields)</h3>
          <button 
            type="button" 
            onClick={addFormField}
            className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> เพิ่มคำถาม
          </button>
        </div>
        <div className="space-y-4">
          {formFields.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
              ไม่มีคำถามเพิ่มเติม
            </div>
          ) : (
            formFields.map((field, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-slate-200 rounded-xl relative group">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">คำถาม</label>
                      <input 
                        type="text" 
                        value={field.label}
                        onChange={(e) => updateFormField(idx, 'label', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        placeholder="เช่น ขนาดเสื้อไซส์อะไร?"
                      />
                    </div>
                    <div className="sm:w-48">
                      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">รูปแบบ</label>
                      <select 
                        value={field.type}
                        onChange={(e) => updateFormField(idx, 'type', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      >
                        <option value="SHORT_TEXT">ข้อความสั้น</option>
                        <option value="DROPDOWN">ตัวเลือก (Dropdown)</option>
                        <option value="CHECKBOX">ตัวเลือกหลายข้อ (Checkbox)</option>
                      </select>
                    </div>
                  </div>
                  
                  {(field.type === 'DROPDOWN' || field.type === 'CHECKBOX') && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">ตัวเลือก (คั่นด้วยลูกน้ำ)</label>
                      <input 
                        type="text" 
                        value={field.options}
                        onChange={(e) => updateFormField(idx, 'options', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        placeholder="เช่น S,M,L,XL"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <input 
                      type="checkbox" 
                      id={`req-${idx}`}
                      checked={field.isRequired}
                      onChange={(e) => updateFormField(idx, 'isRequired', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
                    />
                    <label htmlFor={`req-${idx}`} className="text-sm font-medium text-slate-700 cursor-pointer">จำเป็นต้องตอบ</label>
                  </div>
                </div>
                
                <div className="flex sm:flex-col items-center justify-center gap-2 pt-6 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-4">
                  <button 
                    type="button"
                    onClick={() => removeFormField(idx)}
                    className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                    title="ลบคำถาม"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-200 gap-4">
        <button 
          onClick={handleDeleteProject}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          ลบโครงการ
        </button>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          บันทึกการตั้งค่าทั้งหมด
        </button>
      </div>
    </div>
  )
}
