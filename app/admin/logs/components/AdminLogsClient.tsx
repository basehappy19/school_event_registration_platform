"use client"

import { useState, useEffect } from "react"
import { History, FileText, Lock, User, Calendar, ShieldCheck, ShieldAlert, ArrowRight, RefreshCw, Search } from "lucide-react"

interface RegistrationLog {
  id: string
  action: string
  projectId: number
  projectTitle: string | null
  studentId: string
  studentName: string | null
  gradeRoom: string | null
  previousStatus: string | null
  newStatus: string | null
  performedBy: string
  ipAddress: string | null
  userAgent: string | null
  details: string | null
  createdAt: string | Date
}

interface ProjectEditLog {
  id: number
  projectId: number
  projectTitle: string
  adminEmail: string
  action: string
  changes: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string | Date
}

interface AdminLoginLog {
  id: number
  emailAttempt: string
  ipAddress: string | null
  userAgent: string | null
  status: "SUCCESS" | "FAILED" | string
  failureReason?: string | null
  createdAt: string | Date
}

export default function AdminLogsClient({
  initialRegistrationLogs,
  initialProjectEditLogs,
  initialAdminLoginLogs
}: {
  initialRegistrationLogs: RegistrationLog[]
  initialProjectEditLogs: ProjectEditLog[]
  initialAdminLoginLogs: AdminLoginLog[]
}) {
  const [activeTab, setActiveTab] = useState<"reg" | "project" | "login">(() => {
    if (typeof window !== "undefined") {
      const urlTab = new URLSearchParams(window.location.search).get("tab") as "reg" | "project" | "login" | null
      if (urlTab === "reg" || urlTab === "project" || urlTab === "login") return urlTab
      const saved = localStorage.getItem("admin_logs_active_tab") as "reg" | "project" | "login" | null
      if (saved === "reg" || saved === "project" || saved === "login") return saved
    }
    return "reg"
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [registrationLogs, setRegistrationLogs] = useState<RegistrationLog[]>(initialRegistrationLogs)
  const [projectEditLogs, setProjectEditLogs] = useState<ProjectEditLog[]>(initialProjectEditLogs)
  const [adminLoginLogs, setAdminLoginLogs] = useState<AdminLoginLog[]>(initialAdminLoginLogs)

  const handleTabChange = (tab: "reg" | "project" | "login") => {
    setActiveTab(tab)
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_logs_active_tab", tab)
      const url = new URL(window.location.href)
      url.searchParams.set("tab", tab)
      window.history.replaceState({}, "", url)
    }
  }

  // Real-time polling without page refresh
  useEffect(() => {
    const fetchRealtimeLogs = async () => {
      try {
        const res = await fetch('/api/admin/logs', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data.registrationLogs) setRegistrationLogs(data.registrationLogs)
          if (data.projectEditLogs) setProjectEditLogs(data.projectEditLogs)
          if (data.adminLoginLogs) setAdminLoginLogs(data.adminLoginLogs)
        }
      } catch (e) {
        // Ignore errors during silent background polling
      }
    }

    const interval = setInterval(fetchRealtimeLogs, 3000)
    return () => clearInterval(interval)
  }, [])

  const getActionBadge = (action: string) => {
    switch (action) {
      case "REGISTER":
      case "SUBMIT_REGISTRATION":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700">นักเรียนลงทะเบียนเอง</span>
      case "CANCEL":
      case "CANCEL_REGISTRATION":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700">นักเรียนสละสิทธิ์</span>
      case "ADMIN_ADD":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">แอดมินเพิ่มชื่อ</span>
      case "ADMIN_DELETE":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">แอดมินลบชื่อ</span>
      case "ADMIN_APPROVE":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-teal-100 text-teal-700">แอดมินอนุมัติตัวจริง</span>
      case "ADMIN_REJECT":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">แอดมินเปลี่ยนเป็นไม่ได้รับสิทธิ์</span>
      case "ADMIN_WAITLIST":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800">แอดมินเปลี่ยนเป็นสำรอง</span>
      case "AUTO_PROMOTE":
      case "AUTO_PROMOTE_WAITLIST":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-700">เลื่อนลำดับอัตโนมัติ</span>
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">{action}</span>
    }
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return "-"
    switch (status) {
      case "APPROVED":
        return <span className="text-emerald-600 font-semibold">ได้รับสิทธิ์ (ตัวจริง)</span>
      case "WAITLISTED":
        return <span className="text-amber-600 font-semibold">สำรอง</span>
      case "REJECTED":
        return <span className="text-rose-600 font-semibold">ไม่ได้รับสิทธิ์</span>
      case "CANCELLED":
      case "DELETED":
        return <span className="text-red-600 font-semibold">ยกเลิก/ลบ</span>
      default:
        return <span>{status}</span>
    }
  }

  const formatDateTime = (dt: string | Date) => {
    const d = new Date(dt)
    return d.toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  }

  const filteredRegLogs = registrationLogs.filter(log => {
    const s = searchTerm.toLowerCase()
    return (
      (log.studentId && log.studentId.toLowerCase().includes(s)) ||
      (log.studentName && log.studentName.toLowerCase().includes(s)) ||
      (log.projectTitle && log.projectTitle.toLowerCase().includes(s)) ||
      (log.performedBy && log.performedBy.toLowerCase().includes(s))
    )
  })

  const filteredProjectLogs = projectEditLogs.filter(log => {
    const s = searchTerm.toLowerCase()
    return (
      (log.projectTitle && log.projectTitle.toLowerCase().includes(s)) ||
      (log.adminEmail && log.adminEmail.toLowerCase().includes(s)) ||
      (log.changes && log.changes.toLowerCase().includes(s))
    )
  })

  const filteredLoginLogs = adminLoginLogs.filter(log => {
    const s = searchTerm.toLowerCase()
    return (
      log.emailAttempt.toLowerCase().includes(s) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(s))
    )
  })

  return (
    <div className="space-y-6">
      {/* Title & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <History className="w-7 h-7 text-indigo-600" />
              บันทึกประวัติการทำงานระบบ
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-time
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            ตรวจสอบการลงทะเบียน สละสิทธิ์ การแก้ไขโครงการ และประวัติการเข้าสู่ระบบอย่างละเอียด (อัปเดตอัตโนมัติ)
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาตามรหัส, ชื่อ หรืออีเมล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/60 rounded-2xl w-fit">
        <button
          onClick={() => handleTabChange("reg")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "reg"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <User className="w-4 h-4" />
          ประวัติการลงทะเบียน / สละสิทธิ์ ({filteredRegLogs.length})
        </button>

        <button
          onClick={() => handleTabChange("project")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "project"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <FileText className="w-4 h-4" />
          ประวัติการแก้ไขโครงการ ({filteredProjectLogs.length})
        </button>

        <button
          onClick={() => handleTabChange("login")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "login"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Lock className="w-4 h-4" />
          ประวัติการเข้าสู่ระบบ ({filteredLoginLogs.length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {activeTab === "reg" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4">วันและเวลา</th>
                  <th className="px-5 py-4">โครงการ</th>
                  <th className="px-5 py-4">นักเรียน</th>
                  <th className="px-5 py-4 text-center">ประเภทรายการ</th>
                  <th className="px-5 py-4 text-center">การเปลี่ยนสถานะ</th>
                  <th className="px-5 py-4">ผู้ดำเนินการ</th>
                  <th className="px-5 py-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRegLogs.length > 0 ? (
                  filteredRegLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 text-slate-500 font-medium">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800 max-w-[200px] truncate">
                        {log.projectTitle || `Project #${log.projectId}`}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{log.studentName || log.studentId}</div>
                        <div className="text-xs text-slate-500">รหัส: {log.studentId} ({log.gradeRoom || "-"})</div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 text-xs">
                          {getStatusBadge(log.previousStatus)}
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          {getStatusBadge(log.newStatus)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs px-2 py-1 bg-slate-100 rounded-md text-slate-700">
                          {log.performedBy}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 font-mono text-xs">
                        {log.ipAddress || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      ไม่พบข้อมูลประวัติการลงทะเบียน/สละสิทธิ์
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "project" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="px-5 py-4 w-44">วันและเวลา</th>
                  <th className="px-5 py-4 w-48">โครงการ</th>
                  <th className="px-5 py-4 w-44">แอดมินผู้แก้ไข</th>
                  <th className="px-5 py-4 w-36 text-center">การกระทำ</th>
                  <th className="px-5 py-4">รายละเอียดการแก้ไข</th>
                  <th className="px-5 py-4 w-32">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjectLogs.length > 0 ? (
                  filteredProjectLogs.map((log) => {
                    let formattedChanges = log.changes
                    try {
                      const parsed = JSON.parse(log.changes)
                      formattedChanges = JSON.stringify(parsed, null, 2)
                    } catch (e) {}

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors align-top">
                        <td className="px-5 py-4 text-slate-500 font-medium whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-900">
                          {log.projectTitle}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-indigo-600 font-semibold">{log.adminEmail}</span>
                        </td>
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                            log.action === "CREATE_PROJECT" ? "bg-emerald-100 text-emerald-700" :
                            log.action === "DELETE_PROJECT" ? "bg-rose-100 text-rose-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {log.action === "CREATE_PROJECT" ? "สร้างโครงการ" :
                             log.action === "DELETE_PROJECT" ? "ลบโครงการ" : "แก้ไขโครงการ"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs overflow-x-auto max-h-48">
                            {formattedChanges}
                          </pre>
                        </td>
                        <td className="px-5 py-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                          {log.ipAddress || "-"}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      ไม่พบข้อมูลประวัติการแก้ไขโครงการ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "login" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4">วันและเวลา</th>
                  <th className="px-5 py-4">อีเมลที่พยายามเข้าใช้งาน</th>
                  <th className="px-5 py-4 text-center">สถานะ</th>
                  <th className="px-5 py-4">รายละเอียด / สาเหตุ</th>
                  <th className="px-5 py-4">IP Address</th>
                  <th className="px-5 py-4">User Agent / Browser</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLoginLogs.length > 0 ? (
                  filteredLoginLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 text-slate-500 font-medium">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {log.emailAttempt}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {log.status === "SUCCESS" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                            <ShieldCheck className="w-3.5 h-3.5" /> สำเร็จ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                            <ShieldAlert className="w-3.5 h-3.5" /> ไม่สำเร็จ
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {log.failureReason || (log.status === "SUCCESS" ? "เข้าสู่ระบบสำเร็จ" : "-")}
                      </td>
                      <td className="px-5 py-4 text-slate-500 font-mono text-xs">
                        {log.ipAddress || "-"}
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs max-w-[250px] truncate" title={log.userAgent || ""}>
                        {log.userAgent || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      ไม่พบข้อมูลประวัติการเข้าสู่ระบบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
