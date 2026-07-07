"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"

export interface RegistrationItem {
  id: string
  status: string
  studentProfile: {
    studentId: string
    prefix: string
    firstName: string
    lastName: string
    grade: string
    room: string
    number: string
  }
}

export default function AnnouncementInteractive({
  allRegistrations,
  uniqueGrades,
  uniqueRooms,
  initialQ = "",
  initialGrade = "",
  initialRoom = ""
}: {
  allRegistrations: RegistrationItem[]
  uniqueGrades: string[]
  uniqueRooms: string[]
  initialQ?: string
  initialGrade?: string
  initialRoom?: string
}) {
  const [q, setQ] = useState(initialQ)
  const [grade, setGrade] = useState(initialGrade)
  const [room, setRoom] = useState(initialRoom)
  const [isAnimating, setIsAnimating] = useState(false)

  const triggerAnimation = () => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 200)
  }

  const handleQChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQ(e.target.value)
    triggerAnimation()
  }

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGrade(e.target.value)
    triggerAnimation()
  }

  const handleRoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoom(e.target.value)
    triggerAnimation()
  }

  const originalSeqMap = useMemo(() => {
    const map = new Map<string, number>()
    const approvedAll = allRegistrations.filter(r => r.status === 'APPROVED')
    approvedAll.forEach((r, idx) => {
      map.set(r.id, idx + 1)
    })
    return map
  }, [allRegistrations])

  const filteredRegistrations = useMemo(() => {
    return allRegistrations.filter(r => {
      if (grade && r.studentProfile.grade !== grade) return false
      if (room && r.studentProfile.room !== room) return false
      if (q.trim()) {
        const query = q.trim().toLowerCase()
        const fullName = `${r.studentProfile.prefix}${r.studentProfile.firstName} ${r.studentProfile.lastName}`.toLowerCase()
        const sId = r.studentProfile.studentId.toLowerCase()
        if (!fullName.includes(query) && !sId.includes(query)) return false
      }
      return true
    })
  }, [allRegistrations, q, grade, room])

  const approvedList = filteredRegistrations.filter(r => r.status === 'APPROVED')

  return (
    <div>
      {/* Filters Section */}
      <div className="bg-white sm:rounded-2xl shadow-xs border-y sm:border border-slate-200 p-4 sm:p-5 mb-6 print:hidden">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">ค้นหารายชื่อ</label>
            <div className="relative">
              {isAnimating ? (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              )}
              <input 
                type="text" 
                value={q}
                onChange={handleQChange}
                placeholder="รหัสนักเรียน หรือ ชื่อ-นามสกุล..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>
          
          <div className="w-full md:w-36">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">ระดับชั้น</label>
            <select value={grade} onChange={handleGradeChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors">
              <option value="">ทุกชั้น</option>
              {uniqueGrades.map(g => (
                <option key={g} value={g}>ม.{g}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-36">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">ห้อง</label>
            <select value={room} onChange={handleRoomChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors">
              <option value="">ทุกห้อง</option>
              {uniqueRooms.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          * { font-family: 'THSarabunNew', sans-serif !important; }
          table { width: 100%; border-collapse: collapse; overflow: visible !important; }
          tr, th, td { overflow: visible !important; }
          th, td { border: 1px solid black !important; padding: 6px 8px 4px 8px !important; font-size: 16pt !important; line-height: 1.4 !important; font-weight: normal; vertical-align: middle; }
          th { font-weight: bold !important; }
          tr { page-break-inside: avoid; }
          h1 { font-size: 22pt !important; font-weight: bold !important; line-height: 1.4 !important; }
          h2 { font-size: 18pt !important; font-weight: bold !important; line-height: 1.4 !important; }
          p, span, div { line-height: 1.4 !important; overflow: visible !important; }
        }
      `}} />
      <div className={`transition-all duration-200 ${isAnimating ? 'opacity-50 scale-[0.998]' : 'opacity-100 scale-100'}`}>
        <div className="bg-white sm:rounded-3xl sm:shadow-sm border-y sm:border border-slate-200 overflow-hidden print:border-none print:shadow-none">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center print:hidden">
            <h3 className="font-bold text-lg text-slate-800">รายชื่อผู้มีสิทธิ์เข้าร่วม ({approvedList.length} คน)</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm sm:whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 print:bg-transparent">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 w-12 sm:w-16 text-center">ลำดับ</th>
                  <th className="px-2 sm:px-6 py-3 sm:py-4 text-center">ชั้น</th>
                  <th className="px-2 sm:px-6 py-3 sm:py-4 text-center">เลขที่</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4">ชื่อ - นามสกุล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvedList.length > 0 ? (
                  approvedList.map((reg, index) => (
                    <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 sm:px-6 py-3 text-center text-slate-500">{originalSeqMap.get(reg.id) || index + 1}</td>
                      <td className="px-2 sm:px-6 py-3 text-center text-slate-600">ม.{reg.studentProfile.grade}/{reg.studentProfile.room}</td>
                      <td className="px-2 sm:px-6 py-3 text-center text-slate-600">{reg.studentProfile.number}</td>
                      <td className="px-3 sm:px-6 py-3 text-slate-800 font-medium wrap-break-word">
                        {reg.studentProfile.prefix}{reg.studentProfile.firstName} {reg.studentProfile.lastName}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 sm:px-6 py-8 text-center text-slate-500">
                      ไม่พบรายชื่อ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
