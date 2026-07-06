"use client"

import { useState, useEffect } from "react"
import { adminAnalyzeAllocation, adminRolloverPromoteWaitlist, adminAcceptRegistration } from "@/app/actions/admin"
import { Sparkles, Loader2, CheckCircle2, AlertCircle, ArrowRight, UserCheck, ShieldAlert, Layers, Clock, X, Info } from "lucide-react"

export default function AdminSeatAssistantModal({
  projectId,
  onClose,
  onSuccess
}: {
  projectId: string
  onClose: () => void
  onSuccess: (msg: string) => void
}) {
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"rollover" | "individual">("rollover")
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    description: React.ReactNode
    onConfirm: () => void
  } | null>(null)

  const loadAnalysis = async () => {
    setLoading(true)
    setError(null)
    const res = await adminAnalyzeAllocation(projectId)
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      setData(res)
    }
  }

  useEffect(() => {
    loadAnalysis()
  }, [projectId])

  const handleConfirmRollover = () => {
    if (!data) return
    const totalWillPromote = data.gradeAnalysis.reduce((sum: number, g: any) => sum + g.willPromote, 0)
    if (totalWillPromote === 0) {
      alert("ไม่มีนักเรียนในรายชื่อสำรองที่สามารถเลื่อนลำดับได้ตามเงื่อนไขโควตา")
      return
    }

    setConfirmModal({
      isOpen: true,
      title: "ยืนยันการเลื่อนสิทธิ์สำรอง",
      description: (
        <span>
          คุณต้องการยืนยันการรับสิทธิ์สำรองตามระบบแนะนำจำนวน <strong className="text-slate-900 font-bold">{totalWillPromote} คน</strong> หรือไม่?
        </span>
      ),
      onConfirm: async () => {
        setConfirmModal(null)
        setActionLoading(true)
        const res = await adminRolloverPromoteWaitlist(projectId)
        setActionLoading(false)

        if (res.error) {
          alert(res.error)
        } else {
          onSuccess(`เลื่อนสิทธิ์สำรองตามระบบส่งต่อสำเร็จจำนวน ${res.totalPromoted} คน!`)
          onClose()
        }
      }
    })
  }

  const handleIndividualAccept = (regId: string, studentName: string) => {
    setConfirmModal({
      isOpen: true,
      title: "ยืนยันปรับสถานะเป็นตัวจริง",
      description: (
        <span>
          คุณต้องการยืนยันปรับสถานะของ <strong className="text-slate-900 font-bold">&quot;{studentName}&quot;</strong> ให้เป็นตัวจริงหรือไม่?
        </span>
      ),
      onConfirm: async () => {
        setConfirmModal(null)
        setActionLoading(true)
        const res = await adminAcceptRegistration(regId)
        setActionLoading(false)

        if (res.error) {
          alert(res.error)
        } else {
          await loadAnalysis()
          onSuccess(`ปรับสถานะของ ${studentName} เป็นตัวจริงสำเร็จ!`)
        }
      }
    })
  }

  const formatDateTime = (dt: string | Date) => {
    return new Date(dt).toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }) + " น."
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">จัดสรรที่นั่งว่างส่งต่อ</h2>
              <p className="text-slate-500 text-xs">คำนวณที่นั่งคงเหลือเพื่อเลื่อนลำดับสำรอง</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-slate-600 mb-3" />
              <p className="text-sm font-medium">กำลังคำนวณข้อมูล...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-3 text-sm font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : data && (
            <>
              {/* Summary Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col">
                  <span className="text-xs text-slate-500 font-medium">โควตารวม</span>
                  <span className="text-xl font-bold text-slate-900 mt-0.5">{data.summary.totalCapacity} <span className="text-xs font-normal text-slate-500">ที่นั่ง</span></span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col">
                  <span className="text-xs text-slate-500 font-medium">รับตัวจริงแล้ว</span>
                  <span className="text-xl font-bold text-slate-900 mt-0.5">{data.summary.approvedTotalCount} <span className="text-xs font-normal text-slate-500">คน</span></span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col">
                  <span className="text-xs text-slate-500 font-medium">ที่นั่งว่างคงเหลือ</span>
                  <span className="text-xl font-bold text-slate-900 mt-0.5">{data.summary.totalRemaining} <span className="text-xs font-normal text-slate-500">ที่นั่ง</span></span>
                </div>
              </div>

              {/* Tabs Switcher */}
              <div className="flex border-b border-slate-200 text-sm">
                <button
                  onClick={() => setActiveTab("rollover")}
                  className={`flex items-center gap-2 px-4 py-2.5 font-semibold border-b-2 transition-colors ${
                    activeTab === "rollover"
                      ? "border-slate-800 text-slate-900"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  1. เลื่อนตามระบบแนะนำ
                </button>
                <button
                  onClick={() => setActiveTab("individual")}
                  className={`flex items-center gap-2 px-4 py-2.5 font-semibold border-b-2 transition-colors ${
                    activeTab === "individual"
                      ? "border-slate-800 text-slate-900"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  2. พิจารณารายคน ({data.waitlistedStudents.length})
                </button>
              </div>

              {/* TAB 1: ROLLOVER SIMULATION */}
              {activeTab === "rollover" && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {data.gradeAnalysis.map((ga: any, idx: number) => (
                      <div key={ga.grade} className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">ม.{ga.grade}</span>
                            {ga.receivedRollover > 0 && idx > 0 && (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                                +ส่งต่อจาก ม.{data.gradeAnalysis[idx - 1].grade} จำนวน {ga.receivedRollover} ที่นั่ง
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            โควตา {ga.capacity} • ตัวจริง {ga.approved} • ว่าง {ga.vacant}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-sm shrink-0">
                          <div className="text-right">
                            <div className="text-xs text-slate-400">สำรองรออยู่</div>
                            <div className="font-semibold text-slate-700">{ga.waitlistCount} คน</div>
                          </div>
                          <div className="text-right border-l border-slate-200 pl-4">
                            <div className="text-xs text-slate-400">รับเพิ่มได้</div>
                            <div className="font-bold text-slate-900 text-base">{ga.willPromote} คน</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Confirmation CTA */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm">
                      <span className="font-medium text-slate-600">ยอดเลื่อนสถานะรวม: </span>
                      <span className="font-bold text-slate-900">
                        {data.gradeAnalysis.reduce((sum: number, g: any) => sum + g.willPromote, 0)} คน
                      </span>
                    </div>
                    <button
                      onClick={handleConfirmRollover}
                      disabled={actionLoading || data.summary.totalRemaining <= 0 || data.gradeAnalysis.reduce((sum: number, g: any) => sum + g.willPromote, 0) === 0}
                      className="px-4 py-2 rounded-lg font-semibold text-sm text-white bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      ยืนยันเลื่อนสิทธิ์
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: INDIVIDUAL GUIDANCE */}
              {activeTab === "individual" && (
                <div className="space-y-3">
                  {data.waitlistedStudents.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                      {data.waitlistedStudents.map((st: any) => (
                        <div key={st.registrationId} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
                                #{st.queueNumber}
                              </span>
                              <span className="font-semibold text-slate-900 text-sm">{st.name}</span>
                              <span className="text-xs text-slate-500">({st.gradeRoom})</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>ลงทะเบียน: {formatDateTime(st.createdAt)}</span>
                              <span>•</span>
                              <span className="font-medium text-slate-600">{st.adviceText}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleIndividualAccept(st.registrationId, st.name)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-lg font-medium text-xs text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0"
                          >
                            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            รับสิทธิ์
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      ไม่มีนักเรียนในรายชื่อสำรอง
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-6">
              <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mb-4 border border-slate-200">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{confirmModal.title}</h3>
              <div className="text-sm text-slate-500 mb-6">{confirmModal.description}</div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors flex items-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
