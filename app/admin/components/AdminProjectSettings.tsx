"use client"

import { useState } from "react"
import { updateProjectSettings, deleteProject } from "@/app/actions/admin"
import { Loader2, Save, CheckCircle2, Plus, Trash2, AlertTriangle, Image as ImageIcon, X, Info, RotateCcw } from "lucide-react"

import { useRouter } from "next/navigation"
import { ProjectWithRelations } from "@/app/types"
import { FieldType } from "@prisma/client"

import { ThaiDatePicker, ThaiTimePicker } from "@/app/components/ThaiPickers"

export default function AdminProjectSettings({ project }: { project: ProjectWithRelations }) {
  const router = useRouter()
  const [showToast, setShowToast] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [fieldToRemove, setFieldToRemove] = useState<number | null>(null)
  const [alertModal, setAlertModal] = useState<{title: string, message: string} | null>(null)

  const [formData, setFormData] = useState({
    title: project.title || "",
    description: project.description || "",
    isPublished: project.isPublished,
    isRegistrationOpen: project.isRegistrationOpen,
    isAnnouncementOpen: project.isAnnouncementOpen,
    registrationStartDate: project.registrationStartDate ? new Date(project.registrationStartDate) : null,
    registrationEndDate: project.registrationEndDate ? new Date(project.registrationEndDate) : null,
    activityDate: project.activityDate ? new Date(project.activityDate) : null,
    activityStartTime: project.activityStartTime ? new Date(project.activityStartTime) : null,
    activityEndTime: project.activityEndTime ? new Date(project.activityEndTime) : null,
    activityLocation: project.activityLocation || "",
  })
  const [posterUrl, setPosterUrl] = useState(project.posterUrl || "")
  const [originalPosterUrl, setOriginalPosterUrl] = useState(project.posterUrl || "")
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [uploadingPoster, setUploadingPoster] = useState(false)

  // State for Quotas
  const [quotas, setQuotas] = useState<{grade: string, capacity: number, waitlistCapacity?: number | null}[]>(
    project.quotas?.length > 0 
      ? project.quotas.map((q: any) => ({ grade: q.grade, capacity: q.capacity, waitlistCapacity: q.waitlistCapacity }))
      : []
  )

  // State for Form Fields
  const [formFields, setFormFields] = useState<{id?: number, label: string, type: FieldType, options: string[], isRequired: boolean}[]>(
    project.formFields?.length > 0
      ? project.formFields.map((f: ProjectWithRelations['formFields'][0]) => {
          let parsedOptions: string[] = []
          try {
            if (f.options) {
               if (f.options.startsWith('[')) {
                 parsedOptions = JSON.parse(f.options)
               } else {
                 parsedOptions = f.options.split(',').map((s: string) => s.trim())
               }
            }
          } catch {
            parsedOptions = f.options ? f.options.split(',').map((s: string) => s.trim()) : []
          }
          return { id: f.id, label: f.label, type: f.type, options: parsedOptions, isRequired: f.isRequired }
        })
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
      setQuotas([...quotas, { grade, capacity: 0, waitlistCapacity: null }].sort((a, b) => Number(a.grade) - Number(b.grade)))
    }
  }

  const handleCapacityChange = (grade: string, capacity: number) => {
    setQuotas(quotas.map(q => q.grade === grade ? { ...q, capacity: isNaN(capacity) ? 0 : capacity } : q))
  }

  const handleWaitlistCapacityChange = (grade: string, val: string) => {
    const num = val === "" ? null : parseInt(val)
    setQuotas(quotas.map(q => q.grade === grade ? { ...q, waitlistCapacity: (num === null || isNaN(num)) ? null : num } : q))
  }

  const addFormField = () => {
    setFormFields([...formFields, { label: "", type: "SHORT_TEXT", options: [], isRequired: false }])
  }

  const removeFormField = (index: number) => {
    setFieldToRemove(index)
  }

  const confirmRemoveField = () => {
    if (fieldToRemove === null) return
    setFormFields(formFields.filter((_, i) => i !== fieldToRemove))
    setFieldToRemove(null)
  }

  const updateFormField = (index: number, field: string, value: string | boolean | FieldType | string[]) => {
    const newFields = [...formFields]
    newFields[index] = { ...newFields[index], [field]: value }
    setFormFields(newFields)
  }

  const addOption = (fieldIndex: number) => {
    const newFields = [...formFields]
    newFields[fieldIndex].options.push("")
    setFormFields(newFields)
  }

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const newFields = [...formFields]
    newFields[fieldIndex].options[optionIndex] = value
    setFormFields(newFields)
  }

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const newFields = [...formFields]
    newFields[fieldIndex].options.splice(optionIndex, 1)
    setFormFields(newFields)
  }

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPoster(true)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        setPosterUrl(data.url)
        setUploadedUrls(prev => [...prev, data.url])
      } else {
        setAlertModal({ title: "เกิดข้อผิดพลาด", message: data.error || "Upload failed" })
      }
    } catch {
      setAlertModal({ title: "เกิดข้อผิดพลาด", message: "Upload failed" })
    } finally {
      setUploadingPoster(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    const isPastEndDate = formData.registrationEndDate ? new Date() > formData.registrationEndDate : false;
    const payload = {
      ...formData,
      isRegistrationOpen: isPastEndDate ? false : formData.isRegistrationOpen,
      posterUrl: posterUrl === "" ? null : posterUrl,
      registrationStartDate: formData.registrationStartDate,
      registrationEndDate: formData.registrationEndDate,
      quotas,
      formFields: formFields.map(f => ({
        ...f,
        options: JSON.stringify(f.options.filter(o => o.trim() !== ""))
      }))
    }
    const res = await updateProjectSettings(project.id, payload)
    setLoading(false)
    
    if (res.error) {
      setAlertModal({ title: "เกิดข้อผิดพลาดในการบันทึก", message: res.error })
      return
    }

    // Cleanup files
    const toDelete = new Set<string>()
    uploadedUrls.forEach(url => { if (url !== posterUrl) toDelete.add(url) })
    if (originalPosterUrl && originalPosterUrl !== posterUrl) {
      toDelete.add(originalPosterUrl)
    }
    Array.from(toDelete).forEach(url => {
      fetch(`/api/upload?url=${encodeURIComponent(url)}`, { method: 'DELETE' }).catch(() => {})
    })
    setOriginalPosterUrl(posterUrl || "")
    setUploadedUrls([])
    
    router.refresh()
    
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleReset = () => {
    setFormData({
      title: project.title || "",
      description: project.description || "",
      isPublished: project.isPublished,
      isRegistrationOpen: project.isRegistrationOpen,
      isAnnouncementOpen: project.isAnnouncementOpen,
      registrationStartDate: project.registrationStartDate ? new Date(project.registrationStartDate) : null,
      registrationEndDate: project.registrationEndDate ? new Date(project.registrationEndDate) : null,
      activityDate: project.activityDate ? new Date(project.activityDate) : null,
      activityStartTime: project.activityStartTime ? new Date(project.activityStartTime) : null,
      activityEndTime: project.activityEndTime ? new Date(project.activityEndTime) : null,
      activityLocation: project.activityLocation || "",
    })
    setPosterUrl(project.posterUrl || "")
    setQuotas(
      project.quotas?.length > 0 
        ? project.quotas.map((q: ProjectWithRelations['quotas'][0]) => ({ grade: q.grade, capacity: q.capacity }))
        : []
    )
    setFormFields(
      project.formFields?.length > 0
        ? project.formFields.map((f: ProjectWithRelations['formFields'][0]) => {
            let parsedOptions: string[] = []
            try {
              if (f.options) {
                 if (f.options.startsWith('[')) {
                   parsedOptions = JSON.parse(f.options)
                 } else {
                   parsedOptions = f.options.split(',').map((s: string) => s.trim())
                 }
              }
            } catch {
              parsedOptions = f.options ? f.options.split(',').map((s: string) => s.trim()) : []
            }
            return { id: f.id, label: f.label, type: f.type, options: parsedOptions, isRequired: f.isRequired }
          })
        : []
    )
    setShowResetModal(false)
  }

  const handleDeleteProject = async () => {
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
            className="text-slate-500 w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors px-1 py-1 rounded-md resize-y min-h-15"
            placeholder="รายละเอียดโครงการ"
          />
        </div>
      </div>

      {/* Poster Upload */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">โปสเตอร์โครงการ</h3>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-48 shrink-0 relative rounded-xl overflow-hidden border-2 border-dashed border-slate-300 bg-slate-50 aspect-3/4 flex flex-col items-center justify-center text-slate-400 group">
            {posterUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={posterUrl} alt="Poster" className={`w-full h-full object-cover transition-opacity ${uploadingPoster ? 'opacity-50' : ''}`} />
                {uploadingPoster && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 text-white z-10">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span className="text-xs font-medium">กำลังอัปโหลด...</span>
                  </div>
                )}
                {!uploadingPoster && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                      เปลี่ยนรูปภาพ
                      <input type="file" className="hidden" accept="image/*" onChange={handlePosterUpload} disabled={uploadingPoster} />
                    </label>
                  </div>
                )}
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full hover:bg-slate-100 transition-colors p-4 text-center">
                {uploadingPoster ? (
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium text-slate-600">อัปโหลดรูปภาพ</span>
                    <span className="text-xs mt-1">แนวตั้ง (3:4)</span>
                  </>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handlePosterUpload} disabled={uploadingPoster} />
              </label>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-500 leading-relaxed">
              อัปโหลดรูปโปสเตอร์ของโครงการเพื่อนำไปแสดงในหน้ารวมโครงการและหน้าต่างลงทะเบียน<br />
              <strong className="text-slate-700">คำแนะนำ:</strong> ใช้รูปภาพแนวตั้ง อัตราส่วนประมาณ 3:4 (เช่น 800x1066 พิกเซล) ไฟล์ PNG หรือ JPG
            </p>
            {posterUrl && (
              <button 
                type="button" 
                onClick={() => {
                  if (posterUrl && uploadedUrls.includes(posterUrl)) {
                    fetch(`/api/upload?url=${encodeURIComponent(posterUrl)}`, { method: 'DELETE' }).catch(() => {})
                    setUploadedUrls(prev => prev.filter(url => url !== posterUrl))
                  }
                  setPosterUrl("")
                }} 
                className="mt-3 text-sm text-rose-600 font-medium hover:text-rose-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" /> ลบรูปโปสเตอร์
              </button>
            )}
          </div>
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

          {(() => {
            const isPastEndDate = formData.registrationEndDate ? new Date() > formData.registrationEndDate : false;
            return (
              <label className={`flex items-start gap-3 p-4 border border-slate-200 rounded-xl transition-colors ${isPastEndDate ? 'bg-slate-50 opacity-80 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}`}>
                <input 
                  type="checkbox" 
                  name="isRegistrationOpen"
                  checked={isPastEndDate ? false : formData.isRegistrationOpen}
                  disabled={isPastEndDate}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div>
                  <span className="block font-medium text-slate-800">เปิดรับสมัคร</span>
                  <span className="block text-xs text-slate-500 mt-0.5">อนุญาตให้นักเรียนกดลงทะเบียนได้</span>
                  {isPastEndDate && (
                    <div className="mt-2 text-[11px] leading-tight text-rose-600 bg-rose-50/80 px-2 py-1.5 rounded border border-rose-100">
                      เลยเวลาปิดรับสมัครแล้ว หากต้องการเปิดอีกครั้ง<br/>กรุณาล้างค่าเวลาปิดรับสมัครด้านล่าง หรือขยายเวลา
                    </div>
                  )}
                </div>
              </label>
            );
          })()}

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

        <div className="mt-4 p-4 bg-sky-50 text-sky-800 text-sm rounded-xl flex items-start gap-3 border border-sky-100">
          <Info className="w-5 h-5 shrink-0 text-sky-600 mt-0.5" />
          <div>
            <strong className="block text-sky-900 mb-1">หลักการเปิดรับสมัคร:</strong>
            การรับสมัครจะเปิดให้นักเรียนลงทะเบียนได้ก็ต่อเมื่อ 
            <ol className="list-decimal ml-5 mt-1.5 space-y-1 text-sky-800">
              <li>สวิตช์ <b className="text-sky-900">&quot;เปิดรับสมัคร&quot;</b> ด้านบนถูกเปิดอยู่ <u>และ</u></li>
              <li>เวลาปัจจุบันอยู่ในช่วง <b className="text-sky-900">วัน/เวลา เปิด-ปิดรับสมัคร</b> ด้านล่าง (ถ้าไม่ได้ตั้งเวลาไว้ ระบบจะยึดตามสวิตช์ด้านบนเป็นหลัก)</li>
            </ol>
            <p className="mt-2 text-xs text-sky-700 bg-sky-100/50 px-2 py-1.5 rounded-md inline-block">* หากปิดสวิตช์ด้านบน จะเป็นการปิดรับสมัครทันทีโดยไม่สนใจช่วงเวลาด้านล่าง</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">วัน/เวลา เปิดรับลงทะเบียน</label>
            <div className="flex items-center gap-2">
              <ThaiDatePicker 
                value={formData.registrationStartDate}
                onChange={(date) => setFormData({ ...formData, registrationStartDate: date })}
                className="flex-1"
              />
              <ThaiTimePicker
                value={formData.registrationStartDate}
                onChange={(time) => setFormData({ ...formData, registrationStartDate: time })}
                className="w-24 shrink-0"
              />
            </div>
          </div>
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-700">วัน/เวลา ปิดรับลงทะเบียน</label>
              {formData.registrationEndDate && (
                <button 
                  type="button" 
                  onClick={() => setFormData({ ...formData, registrationEndDate: null })}
                  className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md transition-colors"
                >
                  <X className="w-3 h-3" /> ล้างค่า
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ThaiDatePicker 
                value={formData.registrationEndDate}
                onChange={(date) => setFormData({ ...formData, registrationEndDate: date })}
                className="flex-1"
              />
              <ThaiTimePicker
                value={formData.registrationEndDate}
                onChange={(time) => setFormData({ ...formData, registrationEndDate: time })}
                className="w-24 shrink-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">วันที่จัดกิจกรรม</label>
          <ThaiDatePicker
            value={formData.activityDate}
            onChange={(date) => setFormData({ ...formData, activityDate: date })}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">เวลาที่จัดกิจกรรม</label>
          <div className="flex items-center gap-2">
            <ThaiTimePicker
              value={formData.activityStartTime}
              onChange={(time) => setFormData({ ...formData, activityStartTime: time })}
              className="flex-1"
            />
            <span className="text-slate-500">-</span>
            <ThaiTimePicker
              value={formData.activityEndTime}
              onChange={(time) => setFormData({ ...formData, activityEndTime: time })}
              className="flex-1"
            />
          </div>
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
              <div key={grade} className={`p-4 rounded-xl border transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-50/50 shadow-xs' : 'border-slate-200 bg-white'}`}>
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
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">คำถามเพิ่มเติม</h3>
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
                      <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">ตัวเลือก</label>
                      <div className="space-y-2">
                        {field.options.map((option, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input 
                              type="text" 
                              value={option}
                              onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                              placeholder={`ตัวเลือกที่ ${optIdx + 1}`}
                            />
                            <button 
                              type="button"
                              onClick={() => removeOption(idx, optIdx)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button 
                          type="button"
                          onClick={() => addOption(idx)}
                          className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1 mt-2"
                        >
                          <Plus className="w-4 h-4" /> เพิ่มตัวเลือก
                        </button>
                      </div>
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
          type="button"
          onClick={() => setShowDeleteModal(true)}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          ลบโครงการ
        </button>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button 
            type="button"
            onClick={() => setShowResetModal(true)} 
            disabled={loading || uploadingPoster}
            className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold py-2.5 px-6 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            ยกเลิกการแก้ไขล่าสุด
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading || uploadingPoster}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-6 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            {uploadingPoster ? "กำลังอัปโหลด..." : "บันทึกการตั้งค่า"}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">ลบโครงการ</h3>
              <p className="text-slate-500 mb-6">
                คุณแน่ใจหรือไม่ที่จะลบโครงการนี้? ข้อมูลทั้งหมด รวมถึงการลงทะเบียนจะถูกลบถาวร
              </p>
              <div className="flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="button"
                  onClick={handleDeleteProject}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">ยกเลิกการแก้ไขล่าสุด</h3>
              <p className="text-slate-500 mb-6">
                คุณแน่ใจหรือไม่? ข้อมูลที่คุณเพิ่งแก้ไขและ<span className="font-semibold text-rose-600">ยังไม่ได้บันทึก</span>จะถูกยกเลิกทั้งหมด และระบบจะดึงข้อมูลเดิมกลับมาแสดงแทน
              </p>
              <div className="flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Field Confirmation Modal */}
      {fieldToRemove !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">ลบคำถาม</h3>
              <p className="text-slate-500 mb-6">
                การลบคำถามจะทำให้คำตอบที่มีอยู่ถูกลบไปด้วย (ถ้ามี) คุณแน่ใจหรือไม่?
              </p>
              <div className="flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setFieldToRemove(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="button"
                  onClick={confirmRemoveField}
                  className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{alertModal.title}</h3>
              <p className="text-slate-500 mb-6">{alertModal.message}</p>
              <div className="flex items-center justify-end">
                <button 
                  type="button"
                  onClick={() => setAlertModal(null)}
                  className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
