"use client"

import { useState } from "react"
import { 
  UserPlus, Edit, Trash2, ShieldAlert, ShieldCheck, History, X, 
  CheckCircle2, AlertCircle, Loader2, User, Lock, FileText, Users, ArrowRight 
} from "lucide-react"
import { 
  createAdminUser, updateAdminUser, deleteAdminUser, getAdminDetailedLogs 
} from "@/app/actions/admin-users"

interface AdminUserWithStats {
  id: number
  email: string
  name: string | null
  role: "ADMIN" | "SUPER_ADMIN" | string
  createdAt: Date | string
  stats: {
    loginCount: number
    editCount: number
    regCount: number
    totalCount: number
  }
}

interface LogEntry {
  id: string
  type: 'LOGIN' | 'EDIT' | 'REGISTRATION' | 'ADMIN_MGMT'
  action: string
  details: string
  ipAddress?: string | null
  createdAt: Date | string
}

const formatThaiDateTime = (date: Date | string) => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return String(date);
  }
};

export default function AdminUsersClient({ initialAdmins }: { initialAdmins: AdminUserWithStats[] }) {
  const [admins, setAdmins] = useState<AdminUserWithStats[]>(initialAdmins)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState<AdminUserWithStats | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<AdminUserWithStats | null>(null)
  const [showLogsModal, setShowLogsModal] = useState<AdminUserWithStats | null>(null)

  // Form state
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<"ADMIN" | "SUPER_ADMIN">("ADMIN")

  // Logs state
  const [logsData, setLogsData] = useState<{
    stats: { loginCount: number; editCount: number; regCount: number; adminMgmtCount?: number; totalCount: number }
    logs: LogEntry[]
  } | null>(null)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [logFilter, setLogFilter] = useState<'ALL' | 'LOGIN' | 'EDIT' | 'REGISTRATION' | 'ADMIN_MGMT'>('ALL')

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setError(msg)
      setSuccessMsg(null)
    } else {
      setSuccessMsg(msg)
      setError(null)
    }
    setTimeout(() => {
      setError(null)
      setSuccessMsg(null)
    }, 4000)
  }

  const handleOpenAdd = () => {
    setEmail("")
    setName("")
    setRole("ADMIN")
    setShowAddModal(true)
  }

  const handleOpenEdit = (admin: AdminUserWithStats) => {
    setName(admin.name || "")
    setRole(admin.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN")
    setShowEditModal(admin)
  }

  const handleOpenLogs = async (admin: AdminUserWithStats) => {
    setShowLogsModal(admin)
    setLoadingLogs(true)
    setLogsData(null)
    setLogFilter('ALL')
    try {
      const res = await getAdminDetailedLogs(admin.email)
      setLogsData(res)
    } catch (err) {
      showNotification("ไม่สามารถดึงข้อมูลประวัติการทำงานได้", true)
    } finally {
      setLoadingLogs(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await createAdminUser({ email, name, role })
      if (res.error) {
        showNotification(res.error, true)
      } else if (res.admin) {
        showNotification("เพิ่มผู้ดูแลระบบใหม่เรียบร้อยแล้ว")
        setShowAddModal(false)
        setAdmins(prev => [{
          ...res.admin!,
          stats: { loginCount: 0, editCount: 0, regCount: 0, totalCount: 0 }
        }, ...prev])
      }
    } catch (err) {
      showNotification("เกิดข้อผิดพลาดในการเชื่อมต่อ", true)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showEditModal) return
    setLoading(true)
    try {
      const res = await updateAdminUser(showEditModal.id, { name, role })
      if (res.error) {
        showNotification(res.error, true)
      } else if (res.admin) {
        showNotification("อัปเดตข้อมูลผู้ดูแลระบบเรียบร้อยแล้ว")
        setAdmins(prev => prev.map(a => a.id === showEditModal.id ? { ...a, name: res.admin!.name, role: res.admin!.role } : a))
        setShowEditModal(null)
      }
    } catch (err) {
      showNotification("เกิดข้อผิดพลาดในการเชื่อมต่อ", true)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!showDeleteModal) return
    setLoading(true)
    try {
      const res = await deleteAdminUser(showDeleteModal.id)
      if (res.error) {
        showNotification(res.error, true)
      } else {
        showNotification("ลบผู้ดูแลระบบออกจากระบบเรียบร้อยแล้ว")
        setAdmins(prev => prev.filter(a => a.id !== showDeleteModal.id))
        setShowDeleteModal(null)
      }
    } catch (err) {
      showNotification("เกิดข้อผิดพลาดในการเชื่อมต่อ", true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">จัดการผู้ดูแลระบบ</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">เพิ่ม ลบ แก้ไขสิทธิ์ และตรวจสอบประวัติการทำงาน ของผู้ดูแลระบบทั้งหมดในโรงเรียน</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-5 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 text-sm"
        >
          <UserPlus className="w-5 h-5" />
          <span>เพิ่มแอดมินใหม่</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold shadow-xs animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Admin Users Table & Mobile Card List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">ผู้ดูแลระบบ</th>
                <th className="py-4 px-6">อีเมล</th>
                <th className="py-4 px-6">บทบาท</th>
                <th className="py-4 px-6">ประวัติการทำงาน</th>
                <th className="py-4 px-6">วันที่เพิ่ม</th>
                <th className="py-4 px-6 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                        admin.role === "SUPER_ADMIN" ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                      }`}>
                        {admin.name ? admin.name.charAt(0).toUpperCase() : admin.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-slate-900">{admin.name || "ไม่ระบุชื่อ"}</div>
                        <div className="text-xs text-slate-400 font-normal">ID: #{admin.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-600">
                    {admin.email}
                  </td>
                  <td className="py-4 px-6">
                    {admin.role === "SUPER_ADMIN" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-700 border border-purple-200/80 shadow-2xs">
                        <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                        <span>Super Admin</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Admin</span>
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleOpenLogs(admin)}
                      className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all border border-slate-200/80 shadow-2xs cursor-pointer group"
                      title="คลิกเพื่อดูรายละเอียดประวัติการทำงานทั้งหมด"
                    >
                      <History className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-600 transition-colors" />
                      <span>ทำรายการทั้งหมด <strong className="text-purple-700">{admin.stats.totalCount}</strong> ครั้ง</span>
                      <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-md border border-slate-200 text-slate-500">คลิกดู</span>
                    </button>
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-500 font-medium">
                    {formatThaiDateTime(admin.createdAt)}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(admin)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                        title="แก้ไขชื่อและบทบาท"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(admin)}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="ลบผู้ดูแลระบบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    ไม่พบรายชื่อผู้ดูแลระบบในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="md:hidden divide-y divide-slate-100">
          {admins.map((admin) => (
            <div key={admin.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shrink-0 shadow-xs ${
                    admin.role === "SUPER_ADMIN" ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                  }`}>
                    {admin.name ? admin.name.charAt(0).toUpperCase() : admin.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-base truncate">{admin.name || "ไม่ระบุชื่อ"}</div>
                    <div className="text-xs text-slate-500 font-medium truncate">{admin.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
                  <button
                    onClick={() => handleOpenEdit(admin)}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="แก้ไข"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(admin)}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="ลบ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <div className="flex items-center gap-2">
                  {admin.role === "SUPER_ADMIN" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-700 border border-purple-200/80 shadow-2xs">
                      <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                      <span>Super Admin</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Admin</span>
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">เพิ่มเมื่อ {formatThaiDateTime(admin.createdAt)}</span>
                </div>

                <button
                  onClick={() => handleOpenLogs(admin)}
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs transition-all border border-slate-200/80 shadow-2xs w-full sm:w-auto justify-center mt-1 sm:mt-0 active:scale-98"
                >
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>ทำรายการทั้งหมด <strong className="text-purple-700 font-black">{admin.stats.totalCount}</strong> ครั้ง</span>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-600 font-semibold ml-1">คลิกดูประวัติ</span>
                </button>
              </div>
            </div>
          ))}
          {admins.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm font-medium">
              ไม่พบรายชื่อผู้ดูแลระบบในระบบ
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">เพิ่มผู้ดูแลระบบใหม่</h3>
                  <p className="text-xs text-slate-500">กำหนดอีเมลและระดับสิทธิ์การเข้าถึง</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">อีเมลผู้ดูแลระบบ <span className="text-rose-500">*</span></label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@phukhieo.ac.th"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ-นามสกุล (ถ้ามี)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="นายอาจารย์ ใจดี"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ระดับสิทธิ์ <span className="text-rose-500">*</span></label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "ADMIN" | "SUPER_ADMIN")}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-800 cursor-pointer"
                >
                  <option value="ADMIN">Admin (ผู้ดูแลระบบธรรมดา - จัดการโครงการ/นักเรียน/ดูประวัติได้)</option>
                  <option value="SUPER_ADMIN">Super Admin (ผู้ดูแลสูงสุด - เพิ่มลดแอดมินและจัดการระบบได้ทั้งหมด)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-sm transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>บันทึกเพิ่มแอดมิน</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">แก้ไขข้อมูลผู้ดูแลระบบ</h3>
                  <p className="text-xs text-slate-500">{showEditModal.email}</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ระบุชื่อผู้ดูแล"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ระดับสิทธิ์ <span className="text-rose-500">*</span></label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "ADMIN" | "SUPER_ADMIN")}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 cursor-pointer"
                >
                  <option value="ADMIN">Admin (ผู้ดูแลระบบธรรมดา)</option>
                  <option value="SUPER_ADMIN">Super Admin (ผู้ดูแลระบบสูงสุด)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-sm transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
                  <span>บันทึกการเปลี่ยนแปลง</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">ยืนยันการลบผู้ดูแลระบบ?</h3>
            <p className="text-slate-600 mb-6 text-xs sm:text-sm">
              คุณต้องการลบสิทธิ์แอดมินของ <strong className="text-slate-900">{showDeleteModal.email}</strong> ออกจากระบบใช่หรือไม่? เมื่อลบแล้วบัญชีนี้จะไม่สามารถเข้าสู่ระบบจัดการหลังบ้านได้อีก
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all cursor-pointer text-sm"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>ลบผู้ดูแลระบบ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Logs Modal ("ตอนไหนกดดูได้เลย") */}
      {showLogsModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-lg">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-lg sm:text-xl">ประวัติการทำงานของแอดมิน</h3>
                    <span className="bg-purple-100 text-purple-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                      {showLogsModal.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    {showLogsModal.name ? `${showLogsModal.name} (${showLogsModal.email})` : showLogsModal.email}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowLogsModal(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            {loadingLogs ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                <span className="text-sm font-semibold text-slate-600">กำลังดึงข้อมูลประวัติการทำงานทั้งหมด...</span>
              </div>
            ) : logsData ? (
              <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                {/* Stats Summary Boxes */}
                {/* Stats Summary Boxes (Clickable Filters) */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <button 
                    type="button"
                    onClick={() => setLogFilter(logFilter === 'LOGIN' ? 'ALL' : 'LOGIN')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      logFilter === 'LOGIN' 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-300' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-800'
                    }`}
                  >
                    <div className={`text-xs font-bold mb-1 ${logFilter === 'LOGIN' ? 'text-slate-300' : 'text-slate-500'}`}>เข้าสู่ระบบ</div>
                    <div className="text-xl font-black">{logsData.stats.loginCount} <span className="text-xs font-normal opacity-75">ครั้ง</span></div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setLogFilter(logFilter === 'EDIT' ? 'ALL' : 'EDIT')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      logFilter === 'EDIT' 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-indigo-600'
                    }`}
                  >
                    <div className={`text-xs font-bold mb-1 ${logFilter === 'EDIT' ? 'text-indigo-200' : 'text-slate-500'}`}>แก้ไขโครงการ</div>
                    <div className="text-xl font-black">{logsData.stats.editCount} <span className="text-xs font-normal opacity-75">ครั้ง</span></div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setLogFilter(logFilter === 'REGISTRATION' ? 'ALL' : 'REGISTRATION')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      logFilter === 'REGISTRATION' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-emerald-600'
                    }`}
                  >
                    <div className={`text-xs font-bold mb-1 ${logFilter === 'REGISTRATION' ? 'text-emerald-200' : 'text-slate-500'}`}>จัดการรายชื่อ</div>
                    <div className="text-xl font-black">{logsData.stats.regCount} <span className="text-xs font-normal opacity-75">ครั้ง</span></div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setLogFilter(logFilter === 'ADMIN_MGMT' ? 'ALL' : 'ADMIN_MGMT')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      logFilter === 'ADMIN_MGMT' 
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-amber-700'
                    }`}
                  >
                    <div className={`text-xs font-bold mb-1 ${logFilter === 'ADMIN_MGMT' ? 'text-amber-200' : 'text-slate-500'}`}>จัดการแอดมิน</div>
                    <div className="text-xl font-black">{logsData.stats.adminMgmtCount || 0} <span className="text-xs font-normal opacity-75">ครั้ง</span></div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setLogFilter('ALL')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer col-span-2 sm:col-span-1 ${
                      logFilter === 'ALL' 
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-300' 
                        : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
                    }`}
                  >
                    <div className={`text-xs font-bold mb-1 ${logFilter === 'ALL' ? 'text-purple-200' : 'text-purple-700'}`}>รวมทั้งหมด</div>
                    <div className="text-xl font-black">{logsData.stats.totalCount} <span className="text-xs font-normal opacity-75">ครั้ง</span></div>
                  </button>
                </div>

                {/* Timeline List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {logFilter === 'ALL' ? 'ไทม์ไลน์กิจกรรมล่าสุด (200 รายการ)' : `แสดงผลเฉพาะ: ${
                        logFilter === 'LOGIN' ? 'เข้าสู่ระบบ' :
                        logFilter === 'EDIT' ? 'แก้ไขโครงการ' :
                        logFilter === 'REGISTRATION' ? 'จัดการรายชื่อ' : 'จัดการแอดมิน'
                      }`}
                    </h4>
                    {logFilter !== 'ALL' && (
                      <button onClick={() => setLogFilter('ALL')} className="text-xs font-bold text-purple-600 hover:underline cursor-pointer">
                        [ล้างตัวกรองแสดงทั้งหมด]
                      </button>
                    )}
                  </div>

                  {(() => {
                    const filteredLogs = logsData.logs.filter(log => logFilter === 'ALL' || log.type === logFilter);
                    return filteredLogs.length === 0 ? (
                      <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200/60 text-slate-400 text-sm">
                        ไม่พบข้อมูลประวัติในหมวดหมู่ที่เลือก
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredLogs.map((log) => (
                          <div key={log.id} className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={`mt-0.5 px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 ${
                                log.type === 'LOGIN' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                log.type === 'EDIT' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                                log.type === 'ADMIN_MGMT' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}>
                                {log.action}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-medium text-slate-800 break-words">{log.details}</div>
                                {log.ipAddress && (
                                  <div className="text-[11px] text-slate-400 font-normal mt-0.5">IP: {log.ipAddress}</div>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                                🕒 {formatThaiDateTime(log.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-rose-500">เกิดข้อผิดพลาดในการโหลดข้อมูลประวัติ</div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 mt-6 flex justify-end shrink-0">
              <button
                onClick={() => setShowLogsModal(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
