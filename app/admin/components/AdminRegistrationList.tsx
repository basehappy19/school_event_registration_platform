"use client"

import { useState, useEffect } from "react"
import { adminAddRegistration, adminDeleteRegistration, adminAcceptRegistration, adminAcceptAllWaitlist } from "@/app/actions/admin"

import { useRouter } from "next/navigation"
import { Loader2, Plus, Search, Trash2, Printer, Download, CheckCircle2, Clock, Eye, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { ProjectWithRelations } from "@/app/types"

export default function AdminRegistrationList({ project }: { project: ProjectWithRelations }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [studentIdInput, setStudentIdInput] = useState("")
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null)
  const [showAcceptAllModal, setShowAcceptAllModal] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, itemsPerPage, project.id])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (message: string, type: 'error' | 'success') => {
    setToast({ message, type })
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentIdInput) return
    setLoading(true)
    const res = await adminAddRegistration(project.id, studentIdInput)
    setLoading(false)
    if (res.error) {
      showToast(res.error === "Student not found" ? "ไม่พบข้อมูลนักเรียน" : res.error, 'error')
    } else {
      setStudentIdInput("")
      showToast("เพิ่มนักเรียนสำเร็จ", "success")
      router.refresh()
    }
  }

  const handleDelete = async (regId: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบรายชื่อนี้?")) return
    setLoading(true)
    const res = await adminDeleteRegistration(regId)
    setLoading(false)
    if (res.error) {
      showToast(res.error, 'error')
    } else {
      showToast("ลบรายชื่อสำเร็จ", "success")
      router.refresh()
    }
  }

  const handlePrint = () => {
    setIsPrinting(true)
    window.open(`/admin/print/${project.id}?print=true`, '_blank')
    setTimeout(() => setIsPrinting(false), 1500)
  }

  const handleExportExcel = async () => {
    setIsExportingExcel(true)
    try {
      const res = await fetch(`/api/export/excel?projectId=${project.id}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      let filename = `Registrations_${project.title}.xlsx`
      const disposition = res.headers.get('content-disposition')
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const utf8Matches = /filename\*=UTF-8''([^;\n]*)/.exec(disposition)
        if (utf8Matches != null && utf8Matches[1]) {
          filename = decodeURIComponent(utf8Matches[1])
        }
      }
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการส่งออก Excel", 'error')
    } finally {
      setIsExportingExcel(false)
    }
  }

  const handleAccept = async (regId: number) => {
    setLoading(true)
    const res = await adminAcceptRegistration(regId)
    setLoading(false)
    if (res.error) {
      showToast(res.error, 'error')
    } else {
      showToast("ปรับสถานะเป็นตัวจริงสำเร็จ", "success")
      router.refresh()
    }
  }

  const handleAcceptAllClick = () => {
    setShowAcceptAllModal(true)
  }

  const confirmAcceptAll = async () => {
    setShowAcceptAllModal(false)
    setLoading(true)
    const res = await adminAcceptAllWaitlist(project.id)
    setLoading(false)
    if (res.error) {
      showToast(res.error, 'error')
    } else {
      showToast("ปรับสถานะรับสำรองทั้งหมดสำเร็จ", "success")
      router.refresh()
    }
  }

  const regs = project.registrations.filter((r) => {
    if (!search) return true
    const term = search.toLowerCase()
    return r.studentProfile.studentId.includes(term) || 
           r.studentProfile.firstName.toLowerCase().includes(term) || 
           r.studentProfile.lastName.toLowerCase().includes(term)
  })

  const totalPages = Math.ceil(regs.length / itemsPerPage) || 1
  const paginatedRegs = regs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-200 ${
          toast.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
        }`}>
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
          {toast.message}
        </div>
      )}

      {/* Accept All Confirmation Modal */}
      {showAcceptAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">ยืนยันการรับสำรองทั้งหมด</h3>
              <p className="text-slate-500 mb-6">
                คุณแน่ใจหรือไม่ที่จะปรับสถานะผู้สมัครที่เป็น <span className="font-semibold text-amber-600">&quot;สำรอง&quot;</span> ทั้งหมดให้เป็น <span className="font-semibold text-emerald-600">&quot;ตัวจริง&quot;</span>? การกระทำนี้ไม่สามารถย้อนกลับได้ทีละหลายคน
              </p>
              <div className="flex items-center justify-end gap-3">
                <button 
                  onClick={() => setShowAcceptAllModal(false)}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={confirmAcceptAll}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  ยืนยันรับทั้งหมด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">รายชื่อผู้สมัคร ({project.registrations.length} คน)</h3>
          <p className="text-sm text-slate-500 mt-1">จัดการรายชื่อ พิมพ์ประกาศ หรือส่งออกเป็น Excel</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Add Student Form */}
          <form onSubmit={handleAddStudent} className="flex gap-2 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="กรอกรหัสนักเรียน..." 
              value={studentIdInput}
              onChange={e => setStudentIdInput(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors w-full sm:w-56"
            />
            <button 
              type="submit" 
              disabled={loading || !studentIdInput}
              className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center shrink-0 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} 
              เพิ่ม
            </button>
          </form>

          <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>

          {/* Export Actions */}
          <a href={`/announcement/${project.id}`} target="_blank" rel="noreferrer" className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center">
            <Eye className="w-4 h-4 mr-2" /> ดูประกาศหน้าเว็บ
          </a>
          <button 
            type="button" 
            onClick={handlePrint} 
            disabled={isPrinting}
            className="bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center">
            {isPrinting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />} 
            {isPrinting ? 'กำลังเตรียมพิมพ์...' : 'พิมพ์ประกาศ (PDF)'}
          </button>
          <button 
            type="button"
            onClick={handleAcceptAllClick}
            disabled={loading || project.registrations.filter((r) => r.status !== 'APPROVED').length === 0}
            className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center shrink-0"
          >
            <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
            <span>รับสำรองทั้งหมด</span>
          </button>
          <button 
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center shrink-0">
            {isExportingExcel ? <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" /> : <Download className="w-4 h-4 mr-2 shrink-0" />}
            {isExportingExcel ? 'กำลังส่งออก...' : 'ส่งออก Excel'}
          </button>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="ค้นหารายชื่อจากรหัส หรือชื่อ..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 self-end sm:self-auto">
          <span>แสดงหน้าละ:</span>
          <select 
            value={itemsPerPage} 
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value={20}>20 คน</option>
            <option value={50}>50 คน</option>
            <option value={100}>100 คน</option>
            <option value={200}>200 คน</option>
            <option value={999999}>ทั้งหมด</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 w-16 text-center">ลำดับ</th>
              <th className="px-6 py-4 w-20 text-center">สถานะ</th>
              <th className="px-6 py-4">รหัสนักเรียน</th>
              <th className="px-6 py-4">ชื่อ - นามสกุล</th>
              <th className="px-6 py-4 text-center">ชั้น/ห้อง</th>
              <th className="px-6 py-4 text-center">เลขที่</th>
              <th className="px-6 py-4 w-24 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRegs.length > 0 ? (
              paginatedRegs.map((reg, index) => (
                <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3 text-center text-slate-400 font-mono text-xs">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {reg.status === 'APPROVED' ? (
                      <div className="inline-flex items-center text-xs font-medium bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ตัวจริง
                      </div>
                    ) : (
                      <div className="inline-flex items-center text-xs font-medium bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-100">
                        <Clock className="w-3.5 h-3.5 mr-1" /> สำรอง
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3 text-slate-600 font-medium">{reg.studentProfile.studentId}</td>
                  <td className="px-6 py-3 text-slate-800 font-medium">
                    <div>{reg.studentProfile.prefix}{reg.studentProfile.firstName} {reg.studentProfile.lastName}</div>
                    {reg.answers && reg.answers.length > 0 && (
                      <div className="mt-1 text-xs text-slate-500 font-normal space-y-0.5">
                        {reg.answers.map((ans) => {
                          const field = project.formFields?.find((f) => f.id === ans.fieldId)
                          return field ? <div key={ans.id}><span className="font-medium text-slate-600">{field.label}:</span> {ans.value}</div> : null
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center text-slate-600">ม.{reg.studentProfile.grade}/{reg.studentProfile.room}</td>
                  <td className="px-6 py-3 text-center text-slate-600">{reg.studentProfile.number}</td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {reg.status !== 'APPROVED' && (
                        <button 
                          onClick={() => handleAccept(reg.id)}
                          disabled={loading}
                          className="bg-emerald-50 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2 py-1.5 rounded transition-colors flex items-center gap-1.5 text-xs font-medium"
                          title="ปรับเป็นตัวจริง"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          รับเป็นตัวจริง
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(reg.id)}
                        disabled={loading}
                        className="bg-rose-50 text-rose-500 hover:text-rose-700 hover:bg-rose-100 border border-rose-200 px-2 py-1.5 rounded transition-colors flex items-center gap-1.5 text-xs font-medium"
                        title="ลบรายชื่อ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  ไม่พบรายชื่อในระบบ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
        <div>
          <span>แสดง <strong className="text-slate-900">{regs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, regs.length)}</strong> จากทั้งหมด <strong className="text-slate-900">{regs.length}</strong> คน</span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition-colors flex items-center gap-1 font-medium text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> ก่อนหน้า
            </button>
            
            <div className="flex items-center gap-1 px-2 font-medium">
              <span>หน้า <strong className="text-slate-900">{currentPage}</strong> / {totalPages}</span>
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition-colors flex items-center gap-1 font-medium text-xs"
            >
              ถัดไป <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
