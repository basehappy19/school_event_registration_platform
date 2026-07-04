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
  id: number | string
  projectId: number
  projectTitle: string | null
  adminEmail: string | null
  action: string
  changes: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string | Date
}

interface AdminLoginLog {
  id: number | string
  emailAttempt: string | null
  ipAddress: string | null
  userAgent: string | null
  status: "SUCCESS" | "FAILED" | string | null
  failureReason?: string | null
  createdAt: string | Date
}

interface AuditLogEntry {
  id: number | string
  action: string
  adminEmail: string | null
  payload: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string | Date
}

interface ProjectInfo {
  id: number
  title: string
  description: string | null
  activityDate: string | Date | null
  activityLocation: string | null
}

export default function AdminLogsClient({
  role,
  initialRegistrationLogs,
  initialProjectEditLogs,
  initialAdminLoginLogs,
  initialAuditLogs = [],
  initialProjects = []
}: {
  role?: string
  initialRegistrationLogs: RegistrationLog[]
  initialProjectEditLogs: ProjectEditLog[]
  initialAdminLoginLogs: AdminLoginLog[]
  initialAuditLogs?: AuditLogEntry[]
  initialProjects?: ProjectInfo[]
}) {
  const [activeTab, setActiveTab] = useState<"reg" | "project" | "login" | "audit">(() => {
    if (role !== "SUPER_ADMIN") return "reg"
    if (typeof window !== "undefined") {
      const urlTab = new URLSearchParams(window.location.search).get("tab") as "reg" | "project" | "login" | "audit" | null
      if (urlTab === "reg" || urlTab === "project" || urlTab === "login" || urlTab === "audit") return urlTab
      const saved = localStorage.getItem("admin_logs_active_tab") as "reg" | "project" | "login" | "audit" | null
      if (saved === "reg" || saved === "project" || saved === "login" || saved === "audit") return saved
    }
    return "reg"
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [registrationLogs, setRegistrationLogs] = useState<RegistrationLog[]>(initialRegistrationLogs)
  const [projectEditLogs, setProjectEditLogs] = useState<ProjectEditLog[]>(initialProjectEditLogs)
  const [adminLoginLogs, setAdminLoginLogs] = useState<AdminLoginLog[]>(initialAdminLoginLogs)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialAuditLogs)
  const [projects, setProjects] = useState<ProjectInfo[]>(initialProjects)

  const handleTabChange = (tab: "reg" | "project" | "login" | "audit") => {
    if (role !== "SUPER_ADMIN" && tab !== "reg") return;
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
          if (data.auditLogs) setAuditLogs(data.auditLogs)
          if (data.projects) setProjects(data.projects)
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
      case "ADMIN_ROLLOVER":
      case "ROLLOVER":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-violet-100 text-violet-800">แอดมินเลื่อนลำดับ (ทบโควตาว่าง)</span>
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

  const renderProjectCell = (projectId: number, fallbackTitle: string | null) => {
    const proj = projects.find(p => p.id === projectId)
    const displayTitle = proj?.title || fallbackTitle || `Project #${projectId}`

    return (
      <div className="min-w-[240px] max-w-[360px] whitespace-normal py-1">
        <div className="font-bold text-slate-900 leading-snug">
          {displayTitle}
        </div>
        {(proj?.description || proj?.activityLocation) && (
          <div className="mt-1.5 space-y-1 text-xs text-slate-600 bg-slate-50/80 p-2 rounded-xl border border-slate-200/60">
            {proj.description && (
              <div className="text-slate-700 line-clamp-2">
                 {proj.description}
              </div>
            )}
            {proj.activityLocation && (
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                <span>{proj.activityLocation}</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const getLoginUserInfo = (log: AdminLoginLog) => {
    const reason = log.failureReason || ""
    if (reason.startsWith("STUDENT:")) {
      return {
        type: "STUDENT",
        typeLabel: "นักเรียน",
        typeBadge: "bg-emerald-100 text-emerald-700 border border-emerald-200/60",
        details: reason.replace("STUDENT:", "").trim()
      }
    }
    if (reason.startsWith("ADMIN:") || log.status === "SUCCESS") {
      return {
        type: "ADMIN",
        typeLabel: "แอดมิน",
        typeBadge: "bg-purple-100 text-purple-700 border border-purple-200/60",
        details: "เข้าสู่ระบบผู้ดูแลระบบสำเร็จ"
      }
    }
    return {
      type: "FAILED",
      typeLabel: "ไม่พบในระบบ",
      typeBadge: "bg-rose-100 text-rose-700 border border-rose-200/60",
      details: reason.replace("FAILED:", "").trim() || "อีเมลไม่พบในระบบผู้ดูแลหรือนักเรียน"
    }
  }

  const getProjectLogDisplay = (log: ProjectEditLog) => {
    if (!log.changes) return <span className="text-slate-400 italic">-</span>;
    try {
      const parsed = JSON.parse(log.changes);
      const fieldLabels: Record<string, string> = {
        title: "ชื่อโครงการ",
        description: "รายละเอียด",
        activityDate: "วันที่จัดกิจกรรม",
        activityStartTime: "เวลาเริ่ม",
        activityEndTime: "เวลาสิ้นสุด",
        activityLocation: "สถานที่",
        isPublished: "สถานะเผยแพร่",
        isRegistrationOpen: "เปิดรับลงทะเบียน",
        isAnnouncementOpen: "เปิดดูประกาศผล",
        quotas: "โควตารับสมัคร",
        formFields: "คำถามเพิ่มเติม",
        viewerEmails: "ผู้ช่วยตรวจ"
      };

      const formatVal = (key: string, val: any): string => {
        if (val === null || val === undefined) return "-";
        if (typeof val === "boolean") return val ? "✅ เปิดใช้งาน" : "❌ ปิดใช้งาน";
        if (key === "activityDate" && val) {
          try {
            return new Date(val).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
          } catch (e) {
            return String(val);
          }
        }
        if (Array.isArray(val)) {
          if (key === "quotas") return `${val.length} ห้องเรียน`;
          if (key === "formFields") return `${val.length} คำถาม`;
          if (key === "viewerEmails") return `${val.length} อีเมล`;
          return `${val.length} รายการ`;
        }
        if (typeof val === "object") return "ข้อมูลปรับปรุง";
        return String(val);
      };

      if (log.action === "CREATE_PROJECT") {
        const data = parsed.after || parsed || {};
        return (
          <div className="space-y-1.5">
            <div className="font-bold text-emerald-700 flex items-center gap-1.5 text-sm">
              <span>✨ สร้างโครงการใหม่: {data.title || log.projectTitle || "-"}</span>
            </div>
            <div className="text-xs text-slate-500 flex flex-wrap gap-2">
              <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80">📅 {formatVal("activityDate", data.activityDate)}</span>
              <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80">📍 {data.activityLocation || "-"}</span>
              <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80">โควตา: {formatVal("quotas", data.quotas)}</span>
            </div>
          </div>
        );
      }
      if (log.action === "DELETE_PROJECT") {
        const data = parsed.before || parsed || {};
        return (
          <div className="space-y-1">
            <div className="font-bold text-rose-700 flex items-center gap-1.5 text-sm">
              <span>🗑️ ลบโครงการ: {data.title || log.projectTitle || "-"}</span>
            </div>
          </div>
        );
      }

      const before = parsed.before || {};
      const after = parsed.after || {};
      const changedKeys = Object.keys(fieldLabels).filter((key) => {
        return JSON.stringify(before[key]) !== JSON.stringify(after[key]);
      });

      if (changedKeys.length === 0) {
        return <div className="text-slate-400 italic text-xs">บันทึกข้อมูลโครงการ (ไม่มีการเปลี่ยนแปลงค่าหลัก)</div>;
      }

      return (
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2 text-xs shadow-2xs">
          {changedKeys.map((key) => {
            const bVal = formatVal(key, before[key]);
            const aVal = formatVal(key, after[key]);
            return (
              <div key={key} className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-700 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                  {fieldLabels[key]}:
                </span>
                <span className="line-through text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60 font-medium">
                  {bVal}
                </span>
                <span className="text-slate-400 font-bold">➡️</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  {aVal}
                </span>
              </div>
            );
          })}
        </div>
      );
    } catch (e) {
      return (
        <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs overflow-x-auto max-h-48">
          {log.changes}
        </pre>
      );
    }
  };

  const getAuditLogDisplay = (log: AuditLogEntry) => {
    let renderedDetails: React.ReactNode = <span>{log.payload || "-"}</span>;
    try {
      const p = JSON.parse(log.payload || "{}");
      if (log.action === "CREATE_ADMIN") {
        const roleTh = p.role === "SUPER_ADMIN" ? "Super Admin" : "Admin";
        renderedDetails = (
          <div className="space-y-1">
            <div className="font-bold text-slate-900">เพิ่มแอดมินใหม่: {p.name || "-"}</div>
            <div className="text-xs text-slate-500 font-mono">{p.email || "-"}</div>
            <div className="text-xs font-semibold text-emerald-600">สิทธิ์ที่ได้รับ: {roleTh}</div>
          </div>
        );
      } else if (log.action === "UPDATE_ADMIN") {
        const targetEmail = p.new?.email || p.old?.email || "-";
        const targetName = p.new?.name || p.old?.name || "-";
        const nameChanged = p.old?.name !== p.new?.name && (p.old?.name || p.new?.name);
        const roleChanged = p.old?.role !== p.new?.role && (p.old?.role || p.new?.role);

        renderedDetails = (
          <div className="space-y-1.5">
            <div className="font-bold text-slate-900">แก้ไขแอดมิน: {targetName}</div>
            <div className="text-xs text-slate-500 font-mono">{targetEmail}</div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1 mt-1 text-xs">
              {nameChanged ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-500 font-semibold">ชื่อเดิม:</span>
                  <span className="line-through text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60">{p.old?.name || "-"}</span>
                  <span>➡️</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">{p.new?.name || "-"}</span>
                </div>
              ) : null}
              {roleChanged ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-500 font-semibold">สิทธิ์เดิม:</span>
                  <span className="line-through text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60">
                    {p.old?.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                  </span>
                  <span>➡️</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                    {p.new?.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                  </span>
                </div>
              ) : null}
              {!nameChanged && !roleChanged && (
                <div className="text-slate-400 italic">บันทึกข้อมูล (ไม่มีการเปลี่ยนแปลง)</div>
              )}
            </div>
          </div>
        );
      } else if (log.action === "DELETE_ADMIN") {
        const roleTh = p.role === "SUPER_ADMIN" ? "Super Admin" : "Admin";
        renderedDetails = (
          <div className="space-y-1">
            <div className="font-bold text-rose-700">ลบแอดมิน: {p.name || "-"}</div>
            <div className="text-xs text-slate-500 font-mono">{p.email || "-"}</div>
            <div className="text-xs text-slate-400">สิทธิ์เดิม: {roleTh}</div>
          </div>
        );
      } else if (p.email) {
        renderedDetails = <span>แอดมิน: {p.name || p.email} ({p.role || ""})</span>;
      }
    } catch (e) {}

    const actionBadge = (
      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
        log.action === "CREATE_ADMIN" ? "bg-emerald-100 text-emerald-700" :
        log.action === "UPDATE_ADMIN" ? "bg-indigo-100 text-indigo-700" :
        log.action === "DELETE_ADMIN" ? "bg-rose-100 text-rose-700" :
        "bg-amber-100 text-amber-800"
      }`}>
        {log.action === "CREATE_ADMIN" ? "เพิ่มแอดมิน" :
         log.action === "UPDATE_ADMIN" ? "แก้ไขข้อมูลแอดมิน" :
         log.action === "DELETE_ADMIN" ? "ลบแอดมิน" : log.action}
      </span>
    );

    return { renderedDetails, actionBadge };
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

  const filteredLoginLogs = adminLoginLogs.filter((log) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      log.emailAttempt?.toLowerCase().includes(term) ||
      log.ipAddress?.toLowerCase().includes(term) ||
      log.failureReason?.toLowerCase().includes(term) ||
      log.status?.toLowerCase().includes(term)
    )
  })

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      log.adminEmail?.toLowerCase().includes(term) ||
      log.action?.toLowerCase().includes(term) ||
      log.payload?.toLowerCase().includes(term) ||
      log.ipAddress?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6">
      {/* Title & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <History className="w-7 h-7 text-indigo-600" />
            บันทึกประวัติการทำงานระบบ
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            ตรวจสอบการลงทะเบียน สละสิทธิ์ การแก้ไขโครงการ และประวัติการเข้าสู่ระบบอย่างละเอียด
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 p-1.5 bg-slate-200/60 rounded-2xl w-full lg:w-fit">
        <button
          onClick={() => handleTabChange("reg")}
          className={`flex items-center justify-center lg:justify-start gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "reg"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span className="truncate">ประวัติการลงทะเบียน ({filteredRegLogs.length})</span>
        </button>

        {role === "SUPER_ADMIN" && (
          <>
            <button
              onClick={() => handleTabChange("project")}
              className={`flex items-center justify-center lg:justify-start gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeTab === "project"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate">แก้ไขโครงการ ({filteredProjectLogs.length})</span>
            </button>

            <button
              onClick={() => handleTabChange("login")}
              className={`flex items-center justify-center lg:justify-start gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeTab === "login"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span className="truncate">การเข้าสู่ระบบ ({filteredLoginLogs.length})</span>
            </button>

            <button
              onClick={() => handleTabChange("audit")}
              className={`flex items-center justify-center lg:justify-start gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeTab === "audit"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">จัดการแอดมิน ({filteredAuditLogs.length})</span>
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {activeTab === "reg" && (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
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
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors align-top">
                        <td className="px-5 py-4 text-slate-500 font-medium whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-5 py-4 align-top">
                          {renderProjectCell(log.projectId, log.projectTitle)}
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

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredRegLogs.length > 0 ? (
                filteredRegLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate">{log.studentName || log.studentId}</div>
                        <div className="text-xs text-slate-500 font-medium">รหัส: {log.studentId} ({log.gradeRoom || "-"})</div>
                      </div>
                      <div className="shrink-0">{getActionBadge(log.action)}</div>
                    </div>

                    <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
                      <div className="font-semibold text-indigo-900">{renderProjectCell(log.projectId, log.projectTitle)}</div>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 flex-wrap">
                        <span className="text-slate-400 text-[11px] font-medium">การเปลี่ยนสถานะ:</span>
                        <div className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                          {getStatusBadge(log.previousStatus)}
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          {getStatusBadge(log.newStatus)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex-wrap gap-1">
                      <div>🕒 {formatDateTime(log.createdAt)}</div>
                      <div className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-semibold">โดย: {log.performedBy}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-sm font-medium">ไม่พบข้อมูลประวัติการลงทะเบียน/สละสิทธิ์</div>
              )}
            </div>
          </>
        )}

        {role === "SUPER_ADMIN" && activeTab === "project" && (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
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
                    filteredProjectLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors align-top">
                        <td className="px-5 py-4 text-slate-500 font-medium whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-5 py-4 align-top">
                          {renderProjectCell(log.projectId, log.projectTitle)}
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
                          {getProjectLogDisplay(log)}
                        </td>
                        <td className="px-5 py-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                          {log.ipAddress || "-"}
                        </td>
                      </tr>
                    ))
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

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredProjectLogs.length > 0 ? (
                filteredProjectLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-900 text-sm min-w-0 flex-1">{renderProjectCell(log.projectId, log.projectTitle)}</div>
                      <div className="shrink-0">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          log.action === "CREATE_PROJECT" ? "bg-emerald-100 text-emerald-700" :
                          log.action === "DELETE_PROJECT" ? "bg-rose-100 text-rose-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {log.action === "CREATE_PROJECT" ? "สร้างโครงการ" :
                           log.action === "DELETE_PROJECT" ? "ลบโครงการ" : "แก้ไขโครงการ"}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-indigo-600 font-semibold bg-indigo-50/60 px-2.5 py-1.5 rounded-xl border border-indigo-100 w-fit">
                      👤 โดย: {log.adminEmail}
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">รายละเอียดการแก้ไข:</div>
                      {getProjectLogDisplay(log)}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <div>🕒 {formatDateTime(log.createdAt)}</div>
                      <div className="font-mono text-slate-500">IP: {log.ipAddress || "-"}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-sm font-medium">ไม่พบข้อมูลประวัติการแก้ไขโครงการ</div>
              )}
            </div>
          </>
        )}

        {role === "SUPER_ADMIN" && activeTab === "login" && (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4">วันและเวลา</th>
                    <th className="px-5 py-4">อีเมลที่เข้าใช้งาน</th>
                    <th className="px-5 py-4 text-center">ประเภทผู้ใช้</th>
                    <th className="px-5 py-4 text-center">สถานะ</th>
                    <th className="px-5 py-4">รายละเอียด / ชื่อผู้ใช้งาน</th>
                    <th className="px-5 py-4">IP Address</th>
                    <th className="px-5 py-4">User Agent / Browser</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLoginLogs.length > 0 ? (
                    filteredLoginLogs.map((log) => {
                      const userInfo = getLoginUserInfo(log)
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors align-top">
                          <td className="px-5 py-4 text-slate-500 font-medium whitespace-nowrap">
                            {formatDateTime(log.createdAt)}
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-900">
                            {log.emailAttempt}
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${userInfo.typeBadge}`}>
                              {userInfo.typeLabel}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
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
                          <td className="px-5 py-4 text-slate-700 font-medium min-w-[200px] max-w-[350px] whitespace-normal leading-snug">
                            {userInfo.details}
                          </td>
                          <td className="px-5 py-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                            {log.ipAddress || "-"}
                          </td>
                          <td className="px-5 py-4 text-slate-400 text-xs max-w-[200px] truncate" title={log.userAgent || ""}>
                            {log.userAgent || "-"}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        ไม่พบข้อมูลประวัติการเข้าสู่ระบบ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredLoginLogs.length > 0 ? (
                filteredLoginLogs.map((log) => {
                  const userInfo = getLoginUserInfo(log)
                  return (
                    <div key={log.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm truncate">{log.emailAttempt}</div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5" title={log.userAgent || ""}>{log.userAgent || "ไม่ระบุอุปกรณ์"}</div>
                        </div>
                        <div className="shrink-0">
                          {log.status === "SUCCESS" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shadow-2xs">
                              <ShieldCheck className="w-3.5 h-3.5" /> สำเร็จ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold shadow-2xs">
                              <ShieldAlert className="w-3.5 h-3.5" /> ไม่สำเร็จ
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-block ${userInfo.typeBadge}`}>
                            {userInfo.typeLabel}
                          </span>
                          <span className="font-mono text-xs text-slate-500">IP: {log.ipAddress || "-"}</span>
                        </div>
                        <div className="text-xs text-slate-700 font-medium">{userInfo.details}</div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                        <div>🕒 {formatDateTime(log.createdAt)}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 text-sm font-medium">ไม่พบข้อมูลประวัติการเข้าสู่ระบบ</div>
              )}
            </div>
          </>
        )}

        {activeTab === "audit" && (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4">วันและเวลา</th>
                    <th className="px-5 py-4">ผู้ดำเนินการ</th>
                    <th className="px-5 py-4 text-center">ประเภทรายการ</th>
                    <th className="px-5 py-4">รายละเอียดแอดมิน</th>
                    <th className="px-5 py-4">IP Address</th>
                    <th className="px-5 py-4">อุปกรณ์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditLogs.length > 0 ? (
                    filteredAuditLogs.map((log) => {
                      const { renderedDetails, actionBadge } = getAuditLogDisplay(log);
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors align-top">
                          <td className="px-5 py-4 text-slate-500 font-medium whitespace-nowrap">
                            {formatDateTime(log.createdAt)}
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-900">
                            {log.adminEmail}
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            {actionBadge}
                          </td>
                          <td className="px-5 py-4 text-slate-700 font-medium min-w-[200px] max-w-[350px] whitespace-normal leading-snug">
                            {renderedDetails}
                          </td>
                          <td className="px-5 py-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                            {log.ipAddress || "-"}
                          </td>
                          <td className="px-5 py-4 text-slate-400 text-xs max-w-[200px] truncate" title={log.userAgent || ""}>
                            {log.userAgent || "-"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        ไม่พบข้อมูลประวัติจัดการแอดมิน
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredAuditLogs.length > 0 ? (
                filteredAuditLogs.map((log) => {
                  const { renderedDetails, actionBadge } = getAuditLogDisplay(log);
                  return (
                    <div key={log.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] text-slate-400 uppercase font-semibold">ผู้ดำเนินการ:</div>
                          <div className="font-bold text-slate-900 text-sm truncate">{log.adminEmail}</div>
                        </div>
                        <div className="shrink-0">{actionBadge}</div>
                      </div>

                      <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                        {renderedDetails}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex-wrap gap-1">
                        <div>🕒 {formatDateTime(log.createdAt)}</div>
                        <div className="font-mono text-slate-500">IP: {log.ipAddress || "-"}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 text-sm font-medium">ไม่พบข้อมูลประวัติจัดการแอดมิน</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
