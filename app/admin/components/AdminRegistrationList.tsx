"use client"

import { useState, useEffect, useMemo } from "react"
import { adminAddRegistration, adminDeleteRegistration, adminAcceptRegistration, adminRejectRegistration, adminWaitlistRegistration, adminAcceptAllWaitlist, adminSearchStudents } from "@/app/actions/admin"
import { exportProjectToPDF, formatExportFilename } from "@/lib/export"

import { useRouter } from "next/navigation"
import { Loader2, Plus, Search, Trash2, Printer, Download, CheckCircle2, Clock, Eye, AlertCircle, ChevronLeft, ChevronRight, Sparkles, XCircle, X, MessageSquare } from "lucide-react"
import { ProjectWithRelations } from "@/app/types"
import AdminSeatAssistantModal from "./AdminSeatAssistantModal"

export default function AdminRegistrationList({ project }: { project: ProjectWithRelations }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [studentIdInput, setStudentIdInput] = useState("")
  const [search, setSearch] = useState("")
  const [filterGrade, setFilterGrade] = useState<string>("ALL")
  const [filterRoom, setFilterRoom] = useState<string>("ALL")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [sortOrder, setSortOrder] = useState<'oldest' | 'newest'>('oldest')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null)
  const [showAcceptAllModal, setShowAcceptAllModal] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [studentSuggestions, setStudentSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearchingStudent, setIsSearchingStudent] = useState(false)
  const [showSeatAssistantModal, setShowSeatAssistantModal] = useState(false)
  const [selectedCancelReason, setSelectedCancelReason] = useState<{ studentName: string; gradeRoom: string; reason: string; cancelledAt?: any } | null>(null)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ regId: string; studentName: string; gradeRoom: string } | null>(null)

  useEffect(() => {
    if (!studentIdInput || studentIdInput.trim().length < 1) {
      setStudentSuggestions([])
      setShowSuggestions(false)
      return
    }
    const timer = setTimeout(async () => {
      setIsSearchingStudent(true)
      const res = await adminSearchStudents(studentIdInput)
      setStudentSuggestions(res)
      setShowSuggestions(true)
      setIsSearchingStudent(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [studentIdInput])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterGrade, filterRoom, filterStatus, sortOrder, itemsPerPage, project.id])

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
      setShowSuggestions(false)
      showToast("เพิ่มนักเรียนสำเร็จ", "success")
      router.refresh()
    }
  }

  const handleDelete = (reg: any) => {
    setDeleteConfirmModal({
      regId: reg.id,
      studentName: reg.studentProfile ? `${reg.studentProfile.prefix}${reg.studentProfile.firstName} ${reg.studentProfile.lastName}` : "นักเรียน",
      gradeRoom: reg.studentProfile ? `ม.${reg.studentProfile.grade}/${reg.studentProfile.room} เลขที่ ${reg.studentProfile.number}` : ""
    })
  }

  const confirmDeleteRegistration = async () => {
    if (!deleteConfirmModal) return
    setLoading(true)
    const res = await adminDeleteRegistration(deleteConfirmModal.regId)
    setLoading(false)
    if (res.error) {
      showToast(res.error, 'error')
    } else {
      showToast("ลบรายชื่อสำเร็จ", "success")
      setDeleteConfirmModal(null)
      router.refresh()
    }
  }

  const handlePrint = () => {
    setIsPrinting(true)
    window.open(`/admin/print/${project.id}?print=true`, '_blank')
    setTimeout(() => setIsPrinting(false), 1500)
  }

  const handleExportPDF = async () => {
    setIsExportingPDF(true)
    try {
      await exportProjectToPDF(project)
      showToast("ดาวน์โหลด PDF สำเร็จ", "success")
    } catch (err) {
      console.error(err)
      showToast("เกิดข้อผิดพลาดในการสร้าง PDF", "error")
    } finally {
      setIsExportingPDF(false)
    }
  }

  const handleExportExcel = async () => {
    setIsExportingExcel(true)
    try {
      const res = await fetch(`/api/export/excel?projectId=${project.id}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      let filename = formatExportFilename(project.title, project.description, 'xlsx')
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

  const handleAccept = async (regId: string) => {
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

  const handleReject = async (regId: string) => {
    setLoading(true)
    const res = await adminRejectRegistration(regId)
    setLoading(false)
    if (res.error) {
      showToast(res.error, 'error')
    } else {
      showToast("ปรับสถานะเป็นไม่ได้รับสิทธิ์สำเร็จ", "success")
      router.refresh()
    }
  }

  const handleWaitlist = async (regId: string) => {
    setLoading(true)
    const res = await adminWaitlistRegistration(regId)
    setLoading(false)
    if (res.error) {
      showToast(res.error, 'error')
    } else {
      showToast("ปรับสถานะเป็นสำรองสำเร็จ", "success")
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

  const originalSeqMap = useMemo(() => {
    const map = new Map<string, number>()
    const sorted = [...project.registrations].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime()
      const timeB = new Date(b.createdAt || 0).getTime()
      return timeA - timeB
    })
    sorted.forEach((r, idx) => {
      map.set(r.id, idx + 1)
    })
    return map
  }, [project.registrations])

  const uniqueRooms = Array.from(
    new Set([
      "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15",
      ...project.registrations
        .filter((r) => filterGrade === "ALL" || String(r.studentProfile?.grade) === filterGrade)
        .map((r) => String(r.studentProfile?.room || ""))
        .filter(Boolean)
    ])
  ).sort((a, b) => parseInt(a) - parseInt(b) || a.localeCompare(b, "th"))

  const regs = project.registrations
    .filter((r) => {
      if (filterGrade !== "ALL" && String(r.studentProfile?.grade) !== filterGrade) return false
      if (filterRoom !== "ALL" && String(r.studentProfile?.room) !== filterRoom) return false
      if (filterStatus !== "ALL" && r.status !== filterStatus) return false
      if (!search) return true
      const term = search.toLowerCase()
      return r.studentProfile.studentId.includes(term) || 
             r.studentProfile.firstName.toLowerCase().includes(term) || 
             r.studentProfile.lastName.toLowerCase().includes(term) ||
             (r.cancelReason && r.cancelReason.toLowerCase().includes(term))
    })
    .sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime()
      const timeB = new Date(b.createdAt || 0).getTime()
      return sortOrder === 'oldest' ? timeA - timeB : timeB - timeA
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
              <h3 className="text-lg font-bold text-slate-900 mb-2">ยืนยันการรับสำรองทั้งหมด</h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                ยืนยันปรับสถานะผู้ที่อยู่ในลำดับ <span className="font-semibold text-amber-600">&quot;สำรอง&quot;</span> จำนวน <span className="font-bold text-slate-900">{project.registrations.filter(r => r.status === 'WAITLISTED').length} คน</span> ให้เป็น <span className="font-semibold text-emerald-600">&quot;ตัวจริง&quot;</span> หรือไม่?
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

      {/* Seat Assistant Modal */}
      {showSeatAssistantModal && (
        <AdminSeatAssistantModal 
          projectId={project.id} 
          onClose={() => setShowSeatAssistantModal(false)} 
          onSuccess={(msg) => {
            showToast(msg, 'success')
            router.refresh()
          }} 
        />
      )}

      <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">รายชื่อผู้ลงทะเบียน ({project.registrations.length} คน)</h3>
          <p className="text-sm text-slate-500 mt-1">จัดการรายชื่อ พิมพ์ประกาศ หรือส่งออกเป็น Excel</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 w-full xl:flex-1 mt-4 xl:mt-0 xl:pl-6">
          {/* Group 1: ค้นหาและเพิ่มนักเรียน (ยืดสุดบนหน้าจอใหญ่) */}
          <form onSubmit={handleAddStudent} className="flex items-center gap-2 w-full sm:flex-1 min-w-[220px]">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="กรอกรหัส หรือชื่อ..." 
                value={studentIdInput}
                onChange={e => {
                  setStudentIdInput(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => {
                  if (studentSuggestions.length > 0) setShowSuggestions(true)
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200)
                }}
                className="px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors w-full shadow-2xs"
              />
              {showSuggestions && (studentSuggestions.length > 0 || isSearchingStudent) && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {isSearchingStudent ? (
                    <div className="p-3 text-xs text-slate-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังค้นหา...
                    </div>
                  ) : (
                    studentSuggestions.map((st) => {
                      const isRegistered = project.registrations.some((r) => r.studentId === st.studentId)
                      return (
                        <div
                          key={st.studentId}
                          onMouseDown={(e) => {
                            if (isRegistered) {
                              e.preventDefault()
                              return
                            }
                            setStudentIdInput(st.studentId)
                            setShowSuggestions(false)
                          }}
                          className={`p-2.5 transition-colors text-left ${
                            isRegistered
                              ? 'opacity-60 bg-slate-50 cursor-not-allowed'
                              : 'hover:bg-indigo-50 cursor-pointer'
                          }`}
                        >
                          <div className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span>{st.studentId}</span>
                              {isRegistered && (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                  มีในระบบแล้ว
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">ม.{st.grade}/{st.room} เลขที่ {st.number}</span>
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5 truncate">
                            {st.prefix}{st.firstName} {st.lastName}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
            <button 
              type="submit" 
              disabled={loading || !studentIdInput}
              className="bg-indigo-600 text-white hover:bg-indigo-700 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center shrink-0 disabled:opacity-50 shadow-2xs"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} 
              เพิ่ม
            </button>
          </form>

          {/* Group 2: จัดสรรที่นั่งและรับสำรอง */}
          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto items-stretch">
            <button 
              type="button"
              title="ผู้ช่วยจัดสรรที่นั่งว่างส่งต่อ"
              onClick={() => setShowSeatAssistantModal(true)}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white px-2 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center text-center shadow-2xs h-full shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0 text-amber-300" />
              <span>จัดสรรที่นั่งว่างส่งต่อ</span>
            </button>
            <button 
              type="button"
              title="รับสำรองทั้งหมด"
              onClick={handleAcceptAllClick}
              disabled={loading || project.registrations.filter((r) => r.status === 'WAITLISTED').length === 0}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 px-2 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center text-center shrink-0 shadow-2xs h-full"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" />
              <span>รับสำรองทั้งหมด</span>
            </button>
          </div>

          {/* Group 3: ดูประกาศและส่งออกข้อมูล */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:flex sm:w-auto items-stretch">
            <a title="ดูประกาศหน้าเว็บ" href={`/announcement/${project.id}`} target="_blank" rel="noreferrer" className="w-full sm:w-auto bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-1.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center text-center shrink-0 shadow-2xs h-full whitespace-nowrap">
              <Eye className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" /> ดูประกาศ
            </a>
            <button 
              type="button" 
              title="พิมพ์ประกาศ (ผ่านหน้าเว็บ)"
              onClick={handlePrint} 
              disabled={isPrinting}
              className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-50 px-1.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center text-center shrink-0 shadow-2xs h-full whitespace-nowrap"
            >
              {isPrinting ? <Loader2 className="w-3.5 h-3.5 mr-1 sm:mr-1.5 animate-spin shrink-0" /> : <Printer className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" />} 
              <span>{isPrinting ? 'พิมพ์...' : 'พิมพ์ประกาศ'}</span>
            </button>
            <button 
              type="button" 
              title="ดาวน์โหลดไฟล์ PDF โดยตรง (ไม่ต้องผ่านเซิร์ฟเวอร์)"
              onClick={handleExportPDF} 
              disabled={isExportingPDF}
              className="w-full sm:w-auto bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 disabled:opacity-50 px-1.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center text-center shrink-0 shadow-2xs h-full whitespace-nowrap"
            >
              {isExportingPDF ? <Loader2 className="w-3.5 h-3.5 mr-1 sm:mr-1.5 animate-spin shrink-0" /> : <Download className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" />} 
              <span>{isExportingPDF ? 'สร้าง PDF...' : 'โหลด PDF'}</span>
            </button>
            <button 
              type="button"
              title="ส่งออก Excel"
              onClick={handleExportExcel}
              className="w-full sm:w-auto bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center text-center shrink-0 shadow-2xs h-full whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 mr-1 sm:mr-1.5 shrink-0" /> Excel
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col gap-3">
        {/* Full-width Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="ค้นหารายชื่อจากรหัส หรือชื่อ..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-2xs"
          />
        </div>

        {/* Filter Dropdowns below Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs sm:text-sm text-slate-600">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Grade Filter */}
            <select
              value={filterGrade}
              onChange={e => {
                setFilterGrade(e.target.value)
                setFilterRoom("ALL")
              }}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm flex-1 sm:flex-none"
            >
              <option value="ALL">ทุกระดับชั้น</option>
              <option value="4">ม.4</option>
              <option value="5">ม.5</option>
              <option value="6">ม.6</option>
            </select>

            {/* Room Filter */}
            <select
              value={filterRoom}
              onChange={e => setFilterRoom(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm flex-1 sm:flex-none"
            >
              <option value="ALL">ทุกห้อง</option>
              {uniqueRooms.map(room => (
                <option key={room} value={room}>ห้อง {room}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm flex-1 sm:flex-none"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="APPROVED">ตัวจริง</option>
              <option value="WAITLISTED">สำรอง</option>
              <option value="CANCELLED">สละสิทธิ์</option>
              <option value="REJECTED">ไม่ได้รับสิทธิ์</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as 'oldest' | 'newest')}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm w-full sm:w-auto mt-1 sm:mt-0"
            >
              <option value="oldest">ลงทะเบียนก่อนไปหลัง</option>
              <option value="newest">ลงทะเบียนหลังไปก่อน</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-0 border-slate-200">
            <div className="h-4 w-px bg-slate-300 hidden sm:block mx-1"></div>

            {/* Items per page */}
            <div className="flex items-center gap-1.5">
              <span>หน้าละ:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                <option value={20}>20 คน</option>
                <option value={50}>50 คน</option>
                <option value={100}>100 คน</option>
                <option value={200}>200 คน</option>
                <option value={999999}>ทั้งหมด</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-3 sm:px-4 py-3 w-12 text-center text-xs">ลำดับ</th>
              <th className="px-3 sm:px-4 py-3 w-20 text-center text-xs">สถานะ</th>
              <th className="px-3 sm:px-4 py-3 text-xs">ชื่อ - นามสกุล</th>
              <th className="px-3 sm:px-4 py-3 text-xs">เวลาลงทะเบียน</th>
              <th className="px-3 sm:px-4 py-3 w-32 text-center text-xs">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRegs.length > 0 ? (
              paginatedRegs.map((reg, index) => (
                <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 sm:px-4 py-2.5 text-center text-slate-400 font-mono text-xs">
                    {originalSeqMap.get(reg.id) || (currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 text-center">
                    {reg.status === 'APPROVED' ? (
                      <div className="inline-flex items-center text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> ตัวจริง
                      </div>
                    ) : reg.status === 'WAITLISTED' ? (
                      <div className="inline-flex items-center text-[11px] font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200">
                        <Clock className="w-3 h-3 mr-1" /> สำรอง
                      </div>
                    ) : reg.status === 'CANCELLED' ? (
                      <div className="inline-flex items-center text-[11px] font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-300">
                        <XCircle className="w-3 h-3 mr-1" /> สละสิทธิ์
                      </div>
                    ) : (
                      <div className="inline-flex items-center text-[11px] font-bold bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200">
                        <AlertCircle className="w-3 h-3 mr-1" /> ไม่ได้รับสิทธิ์
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 text-slate-800 font-medium">
                    <div>
                      <a 
                        href={`/detail/${project.id}/success?studentId=${reg.studentProfile.studentId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs sm:text-sm font-bold text-slate-800 hover:text-indigo-600 hover:underline inline-flex items-center gap-1"
                        title="คลิกเพื่อดูหน้าข้อมูลการลงทะเบียน"
                      >
                        {reg.studentProfile.prefix}{reg.studentProfile.firstName} {reg.studentProfile.lastName}
                      </a>
                    </div>
                    <div className="text-[11px] font-semibold text-indigo-600 mt-0.5">
                      ม.{reg.studentProfile.grade}/{reg.studentProfile.room} เลขที่ {reg.studentProfile.number}
                    </div>
                    {reg.answers && reg.answers.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-slate-100 text-[11px] text-slate-500 font-normal space-y-0.5">
                        {reg.answers.map((ans) => {
                          const field = project.formFields?.find((f) => f.id === ans.fieldId)
                          return field ? <div key={ans.id}><span className="font-medium text-slate-600">{field.label}:</span> {ans.value}</div> : null
                        })}
                      </div>
                    )}
                    {reg.status === 'CANCELLED' && (
                      <div className="mt-2 pt-2 border-t border-rose-200 flex items-center justify-between gap-2 bg-rose-50/90 px-2.5 py-1.5 rounded-xl border">
                        <div className="text-xs text-rose-800 font-medium truncate max-w-[220px]">
                          <span className="font-bold">เหตุผลสละสิทธิ์: </span>
                          <span>{reg.cancelReason || "ไม่ระบุเหตุผล"}</span>
                        </div>
                        <button
                          onClick={() => setSelectedCancelReason({
                            studentName: `${reg.studentProfile.prefix}${reg.studentProfile.firstName} ${reg.studentProfile.lastName}`,
                            gradeRoom: `ม.${reg.studentProfile.grade}/${reg.studentProfile.room} เลขที่ ${reg.studentProfile.number}`,
                            reason: reg.cancelReason || "ไม่ระบุเหตุผล",
                            cancelledAt: reg.createdAt
                          })}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg transition-colors shadow-2xs shrink-0 cursor-pointer"
                        >
                          อ่านเหตุผล
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 text-slate-600 text-xs font-mono">
                    {reg.createdAt ? new Date(reg.createdAt).toLocaleString("th-TH", {
                      timeZone: "Asia/Bangkok",
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit"
                    }) + " น." : "-"}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <a
                        href={`/detail/${project.id}/success?studentId=${reg.studentProfile.studentId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-indigo-50 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 border border-indigo-200 p-1.5 sm:px-2 sm:py-1 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium shrink-0 shadow-2xs"
                        title="ดูข้อมูลหน้าสำเร็จ"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">ดูข้อมูล</span>
                      </a>

                      <select
                        value={reg.status}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'APPROVED' && reg.status !== 'APPROVED') handleAccept(reg.id);
                          else if (val === 'WAITLISTED' && reg.status !== 'WAITLISTED') handleWaitlist(reg.id);
                          else if (val === 'REJECTED' && reg.status !== 'REJECTED') handleReject(reg.id);
                        }}
                        disabled={loading}
                        className={`text-[11px] sm:text-xs font-bold px-2 py-1 rounded-lg border shadow-2xs focus:outline-none focus:ring-2 cursor-pointer transition-colors shrink-0 ${
                          reg.status === 'APPROVED' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 focus:ring-emerald-500' 
                            : reg.status === 'WAITLISTED' 
                            ? 'bg-amber-50 text-amber-700 border-amber-300 focus:ring-amber-500' 
                            : reg.status === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800 border-rose-300 focus:ring-rose-500'
                            : 'bg-rose-50 text-rose-700 border-rose-300 focus:ring-rose-500'
                        }`}
                        title="เปลี่ยนสถานะผู้ลงทะเบียน"
                      >
                        <option value="APPROVED">ตัวจริง</option>
                        <option value="WAITLISTED">สำรอง</option>
                        <option value="REJECTED">ไม่ได้รับสิทธิ์</option>
                        {reg.status === 'CANCELLED' && <option value="CANCELLED" disabled>สละสิทธิ์</option>}
                      </select>

                      <button 
                        onClick={() => handleDelete(reg)}
                        disabled={loading}
                        className="bg-rose-50 text-rose-500 hover:text-rose-700 hover:bg-rose-100 border border-rose-200 p-1.5 rounded-lg transition-colors flex items-center justify-center shrink-0 shadow-2xs cursor-pointer"
                        title="ลบรายชื่อ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  ไม่พบรายชื่อในระบบ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden divide-y divide-slate-100">
        {paginatedRegs.length > 0 ? (
          paginatedRegs.map((reg, index) => (
            <div key={reg.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                    #{originalSeqMap.get(reg.id) || (currentPage - 1) * itemsPerPage + index + 1}
                  </span>
                  {reg.status === 'APPROVED' ? (
                    <div className="inline-flex items-center text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> ตัวจริง
                    </div>
                  ) : reg.status === 'WAITLISTED' ? (
                    <div className="inline-flex items-center text-[11px] font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200">
                      <Clock className="w-3 h-3 mr-1" /> สำรอง
                    </div>
                  ) : reg.status === 'CANCELLED' ? (
                    <div className="inline-flex items-center text-[11px] font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-300">
                      <XCircle className="w-3 h-3 mr-1" /> สละสิทธิ์
                    </div>
                  ) : (
                    <div className="inline-flex items-center text-[11px] font-bold bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200">
                      <AlertCircle className="w-3 h-3 mr-1" /> ไม่ได้รับสิทธิ์
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => handleDelete(reg)}
                  disabled={loading}
                  className="bg-rose-50 text-rose-500 hover:text-rose-700 hover:bg-rose-100 border border-rose-200 p-1.5 rounded-lg transition-colors flex items-center justify-center shrink-0 shadow-2xs cursor-pointer"
                  title="ลบรายชื่อ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <a 
                  href={`/detail/${project.id}/success?studentId=${reg.studentProfile.studentId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-bold text-slate-900 hover:text-indigo-600 hover:underline inline-flex items-center gap-1"
                  title="คลิกเพื่อดูหน้าข้อมูลการลงทะเบียน"
                >
                  {reg.studentProfile.prefix}{reg.studentProfile.firstName} {reg.studentProfile.lastName}
                </a>
                <div className="text-xs font-semibold text-indigo-600 mt-0.5">
                  ม.{reg.studentProfile.grade}/{reg.studentProfile.room} เลขที่ {reg.studentProfile.number} • รหัส {reg.studentProfile.studentId}
                </div>
                {reg.answers && reg.answers.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600 font-normal space-y-1 bg-slate-50/80 p-2.5 rounded-xl border">
                    {reg.answers.map((ans) => {
                      const field = project.formFields?.find((f) => f.id === ans.fieldId)
                      return field ? <div key={ans.id}><span className="font-semibold text-slate-700">{field.label}:</span> {ans.value}</div> : null
                    })}
                  </div>
                )}
                {reg.status === 'CANCELLED' && (
                  <div className="mt-2 pt-2 border-t border-rose-200 flex items-center justify-between gap-2 bg-rose-50/90 p-2.5 rounded-xl border">
                    <div className="text-xs text-rose-800 font-medium truncate flex-1">
                      <span className="font-bold">เหตุผลสละสิทธิ์: </span>
                      <span>{reg.cancelReason || "ไม่ระบุเหตุผล"}</span>
                    </div>
                    <button
                      onClick={() => setSelectedCancelReason({
                        studentName: `${reg.studentProfile.prefix}${reg.studentProfile.firstName} ${reg.studentProfile.lastName}`,
                        gradeRoom: `ม.${reg.studentProfile.grade}/${reg.studentProfile.room} เลขที่ ${reg.studentProfile.number}`,
                        reason: reg.cancelReason || "ไม่ระบุเหตุผล",
                        cancelledAt: reg.createdAt
                      })}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg transition-colors shadow-2xs shrink-0 cursor-pointer"
                    >
                      อ่านเหตุผล
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  {reg.createdAt ? new Date(reg.createdAt).toLocaleString("th-TH", {
                    timeZone: "Asia/Bangkok",
                    day: "numeric",
                    month: "short",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  }) + " น." : "-"}
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                  <select
                    value={reg.status}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'APPROVED' && reg.status !== 'APPROVED') handleAccept(reg.id);
                      else if (val === 'WAITLISTED' && reg.status !== 'WAITLISTED') handleWaitlist(reg.id);
                      else if (val === 'REJECTED' && reg.status !== 'REJECTED') handleReject(reg.id);
                    }}
                    disabled={loading}
                    className={`flex-1 sm:flex-none text-xs font-bold px-3 py-1.5 rounded-lg border shadow-2xs focus:outline-none focus:ring-2 cursor-pointer transition-colors ${
                      reg.status === 'APPROVED' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 focus:ring-emerald-500' 
                        : reg.status === 'WAITLISTED' 
                        ? 'bg-amber-50 text-amber-700 border-amber-300 focus:ring-amber-500' 
                        : reg.status === 'CANCELLED'
                        ? 'bg-rose-100 text-rose-800 border-rose-300 focus:ring-rose-500'
                        : 'bg-rose-50 text-rose-700 border-rose-300 focus:ring-rose-500'
                    }`}
                  >
                    <option value="APPROVED">ตัวจริง</option>
                    <option value="WAITLISTED">สำรอง</option>
                    <option value="REJECTED">ไม่ได้รับสิทธิ์</option>
                    {reg.status === 'CANCELLED' && <option value="CANCELLED" disabled>สละสิทธิ์</option>}
                  </select>
                  <a
                    href={`/detail/${project.id}/success?studentId=${reg.studentProfile.studentId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-indigo-50 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 text-xs font-medium shrink-0 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ดูข้อมูล</span>
                  </a>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-12 text-center text-slate-500 text-sm">
            ไม่พบรายชื่อในระบบ
          </div>
        )}
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

      {/* Cancel Reason Modal */}
      {selectedCancelReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-left animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">เหตุผลการสละสิทธิ์</h3>
                  <p className="text-xs font-semibold text-rose-700 mt-0.5">{selectedCancelReason.studentName}</p>
                  <p className="text-[11px] text-slate-500">{selectedCancelReason.gradeRoom}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCancelReason(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-600 flex items-center justify-between">
                <span>ข้อความ/เหตุผลที่นักเรียนระบุ:</span>
                {selectedCancelReason.cancelledAt && (
                  <span className="text-[11px] text-slate-400 font-normal">
                    {new Date(selectedCancelReason.cancelledAt).toLocaleString("th-TH", {
                      timeZone: "Asia/Bangkok",
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })} น.
                  </span>
                )}
              </div>
              <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed min-h-[90px] shadow-2xs">
                {selectedCancelReason.reason}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedCancelReason(null)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
              >
                รับทราบ และปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-left animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">ยืนยันลบรายชื่อผู้ลงทะเบียน</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">คุณต้องการลบรายชื่อนี้ใช่หรือไม่?</p>
              </div>
            </div>

            <div className="my-5 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="text-sm font-bold text-slate-900">
                {deleteConfirmModal.studentName}
              </div>
              {deleteConfirmModal.gradeRoom && (
                <div className="text-xs font-semibold text-indigo-600">
                  {deleteConfirmModal.gradeRoom}
                </div>
              )}
              <div className="pt-2 mt-2 border-t border-slate-200/60 text-xs text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>คำเตือน: ข้อมูลการลงทะเบียนและการตอบคำถามทั้งหมดจะถูกลบถาวร ไม่สามารถกู้คืนได้</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmModal(null)}
                disabled={loading}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDeleteRegistration}
                disabled={loading}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-all shadow-2xs flex items-center gap-2 active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>ยืนยันลบรายชื่อ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
