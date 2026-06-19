"use client"

import { useState } from "react"
import { adminAddRegistration, adminDeleteRegistration, adminAcceptRegistration, adminAcceptAllWaitlist } from "@/app/actions/admin"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Search, Trash2, Printer, Download, CheckCircle2, Clock, Eye } from "lucide-react"

export default function AdminRegistrationList({ project }: { project: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [studentIdInput, setStudentIdInput] = useState("")
  const [search, setSearch] = useState("")

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentIdInput) return
    setLoading(true)
    const res = await adminAddRegistration(project.id, studentIdInput)
    setLoading(false)
    if (res.error) {
      alert(res.error)
    } else {
      setStudentIdInput("")
      router.refresh()
    }
  }

  const handleDelete = async (regId: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบรายชื่อนี้?")) return
    setLoading(true)
    const res = await adminDeleteRegistration(regId)
    setLoading(false)
    if (res.error) {
      alert(res.error)
    } else {
      router.refresh()
    }
  }

  const handlePrint = () => {
    // Create an off-screen iframe so html2pdf can render the DOM without opening a new tab
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.width = '1000px'
    iframe.style.height = '1000px'
    iframe.style.top = '-9999px'
    iframe.style.left = '-9999px'
    iframe.style.visibility = 'hidden'
    iframe.src = `/admin/print/${project.id}?print=true`
    document.body.appendChild(iframe)

    // Remove the iframe after 10 seconds to clean up
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
    }, 10000)
  }

  const handleAccept = async (regId: number) => {
    setLoading(true)
    const res = await adminAcceptRegistration(regId)
    setLoading(false)
    if (res.error) {
      alert(res.error)
    } else {
      router.refresh()
    }
  }

  const handleAcceptAll = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะปรับสถานะสำรองทั้งหมดให้เป็นตัวจริง?")) return
    setLoading(true)
    const res = await adminAcceptAllWaitlist(project.id)
    setLoading(false)
    if (res.error) {
      alert(res.error)
    } else {
      router.refresh()
    }
  }

  const regs = project.registrations.filter((r: any) => {
    if (!search) return true
    const term = search.toLowerCase()
    return r.studentProfile.studentId.includes(term) || 
           r.studentProfile.firstName.toLowerCase().includes(term) || 
           r.studentProfile.lastName.toLowerCase().includes(term)
  })

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
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
          <button onClick={handlePrint} className="bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center">
            <Printer className="w-4 h-4 mr-2" /> พิมพ์ประกาศ (PDF)
          </button>
          <button 
            onClick={handleAcceptAll}
            disabled={loading || regs.filter((r: any) => r.status === 'WAITLISTED').length === 0}
            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 border border-emerald-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">รับสำรองทั้งหมด</span>
          </button>
          <a 
            href={`/api/export/excel?projectId=${project.id}`}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <Download className="w-4 h-4 mr-2" /> ส่งออก Excel
          </a>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-b border-slate-100">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="ค้นหารายชื่อจากรหัส หรือชื่อ..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 w-16 text-center">สถานะ</th>
              <th className="px-6 py-4">รหัสนักเรียน</th>
              <th className="px-6 py-4">ชื่อ - นามสกุล</th>
              <th className="px-6 py-4 text-center">ชั้น/ห้อง</th>
              <th className="px-6 py-4 text-center">เลขที่</th>
              <th className="px-6 py-4 w-24 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {regs.length > 0 ? (
              regs.map((reg: any) => (
                <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
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
                    {reg.studentProfile.prefix}{reg.studentProfile.firstName} {reg.studentProfile.lastName}
                  </td>
                  <td className="px-6 py-3 text-center text-slate-600">ม.{reg.studentProfile.grade}/{reg.studentProfile.room}</td>
                  <td className="px-6 py-3 text-center text-slate-600">{reg.studentProfile.number}</td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {reg.status === 'WAITLISTED' && (
                        <button 
                          onClick={() => handleAccept(reg.id)}
                          disabled={loading}
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-1.5 rounded transition-colors"
                          title="ปรับเป็นตัวจริง"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(reg.id)}
                        disabled={loading}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded transition-colors"
                        title="ลบรายชื่อ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  ไม่พบรายชื่อในระบบ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
