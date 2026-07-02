"use client"

import { useState, useEffect } from "react"
import { adminAnalyzeAllocation, adminRolloverPromoteWaitlist, adminAcceptRegistration } from "@/app/actions/admin"
import { Sparkles, Loader2, CheckCircle2, AlertCircle, ArrowRight, UserCheck, ShieldAlert, Layers, Clock, X, Info } from "lucide-react"

export default function AdminSeatAssistantModal({
  projectId,
  onClose,
  onSuccess
}: {
  projectId: number
  onClose: () => void
  onSuccess: (msg: string) => void
}) {
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"rollover" | "individual">("rollover")

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

  const handleConfirmRollover = async () => {
    if (!data) return
    const totalWillPromote = data.gradeAnalysis.reduce((sum: number, g: any) => sum + g.willPromote, 0)
    if (totalWillPromote === 0) {
      alert("ไม่มีนักเรียนในรายชื่อสำรองที่สามารถเลื่อนลำดับได้ตามเงื่อนไขโควตา")
      return
    }
    if (!confirm(`ยืนยันการรับสิทธิ์สำรองตามระบบแนะนำจำนวน ${totalWillPromote} คนหรือไม่?`)) return

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

  const handleIndividualAccept = async (regId: number, studentName: string) => {
    if (!confirm(`ยืนยันปรับสถานะของ "${studentName}" ให้เป็นตัวจริงหรือไม่?`)) return
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

  const formatDateTime = (dt: string | Date) => {
    return new Date(dt).toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) + " น."
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-inner border border-white/10 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">ระบบผู้ช่วยจัดสรรที่นั่งว่าง (Seat Allocation Assistant)</h2>
              <p className="text-indigo-200 text-xs sm:text-sm mt-0.5">วิเคราะห์โควตาว่างส่งต่อเป็นทอดๆ (ม.6 &rarr; ม.5 &rarr; ม.4) และคำแนะนำคิวสำรอง</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
              <p className="font-semibold">กำลังวิเคราะห์โควตาและคิวสำรอง...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-3 font-semibold">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <span>{error}</span>
            </div>
          ) : data && (
            <>
              {/* Summary Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">โควตารวมทั้งโครงการ</span>
                  <span className="text-2xl font-black text-slate-900 mt-1">{data.summary.totalCapacity} <span className="text-sm font-medium text-slate-500">ที่นั่ง</span></span>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200/80 flex flex-col">
                  <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">รับตัวจริงแล้วปัจจุบัน</span>
                  <span className="text-2xl font-black text-emerald-600 mt-1">{data.summary.approvedTotalCount} <span className="text-sm font-medium text-emerald-600/80">คน</span></span>
                </div>
                <div className={`p-4 rounded-2xl border flex flex-col ${
                  data.summary.totalRemaining > 0 ? "bg-indigo-50 border-indigo-200 text-indigo-900" : "bg-rose-50 border-rose-200 text-rose-900"
                }`}>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80">ที่นั่งว่างคงเหลือรวมทั้งหมด</span>
                  <span className="text-2xl font-black mt-1">{data.summary.totalRemaining} <span className="text-sm font-medium opacity-80">ที่นั่ง</span></span>
                </div>
              </div>

              {/* Tabs Switcher */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab("rollover")}
                  className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
                    activeTab === "rollover"
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  1. จำลองการส่งต่อโควตาว่าง (Rollover ม.6 &rarr; ม.5 &rarr; ม.4)
                </button>
                <button
                  onClick={() => setActiveTab("individual")}
                  className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
                    activeTab === "individual"
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  2. พิจารณารับทีละคนพร้อมคำแนะนำ ({data.waitlistedStudents.length} คน)
                </button>
              </div>

              {/* TAB 1: ROLLOVER SIMULATION */}
              {activeTab === "rollover" && (
                <div className="space-y-6">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 text-sm text-amber-900 flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">หลักการส่งต่อที่นั่งว่าง (Cascading Seat Rollover):</p>
                      <p className="mt-1 leading-relaxed">
                        ระบบจะตรวจสอบโควตาที่เหลือของชั้นพี่ใหญ่สุดก่อน (เช่น ม.6) หากมีที่นั่งเหลือและไม่มีสำรองชั้นนั้นแล้ว ที่นั่งว่างจะถูกส่งต่อลงมาเพิ่มให้ชั้นน้อง (ม.5 และ ม.4 ตามลำดับ) โดยยอดรับรวมทั้งหมดจะไม่เกินเพดานสูงสุดของโครงการ
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {data.gradeAnalysis.map((ga: any, idx: number) => (
                      <div key={ga.grade} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm transition-all hover:border-slate-300">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-black text-sm">
                                ชั้น ม.{ga.grade}
                              </span>
                              {ga.receivedRollover > 0 && (
                                <span className="px-2.5 py-1 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center gap-1">
                                  +รับต่อจากรุ่นพี่มา {ga.receivedRollover} ที่นั่ง
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                              โควตาตั้งต้น {ga.capacity} คน &bull; รับตัวจริงแล้ว {ga.approved} คน &bull; <span className="font-semibold text-slate-700">ที่นั่งว่างชั้นตัวเอง {ga.vacant} ที่นั่ง</span>
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80 text-sm">
                            <div className="text-center px-3 border-r border-slate-100">
                              <div className="text-xs text-slate-400 font-medium">โควตารวมที่ใช้ได้</div>
                              <div className="font-bold text-slate-800 text-base">{ga.totalPool} <span className="text-xs">ที่นั่ง</span></div>
                            </div>
                            <div className="text-center px-3 border-r border-slate-100">
                              <div className="text-xs text-slate-400 font-medium">ผู้รอสำรอง ม.{ga.grade}</div>
                              <div className="font-bold text-amber-600 text-base">{ga.waitlistCount} <span className="text-xs">คน</span></div>
                            </div>
                            <div className="text-center px-3">
                              <div className="text-xs text-indigo-500 font-bold">ระบบแนะนำรับเพิ่ม</div>
                              <div className="font-black text-emerald-600 text-lg">{ga.willPromote} <span className="text-xs">คน</span></div>
                            </div>
                          </div>
                        </div>

                        {ga.passDownRollover > 0 && idx < data.gradeAnalysis.length - 1 && (
                          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-2 text-xs font-bold text-teal-700">
                            <ArrowRight className="w-4 h-4 text-teal-600 animate-pulse" />
                            <span>เหลือที่นั่งว่างส่งต่อให้ชั้น ม.{data.gradeAnalysis[idx + 1].grade} ต่อจำนวน {ga.passDownRollover} ที่นั่ง</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Confirmation CTA */}
                  <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="font-black text-emerald-950 text-base">พร้อมจัดสรรตามระบบแนะนำหรือไม่?</h4>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        ระบบจะเลื่อนสถานะนักเรียนสำรองตามจำนวนและลำดับคิวข้างต้นรวมทั้งสิ้น{" "}
                        <span className="font-black text-emerald-700 underline text-sm">
                          {data.gradeAnalysis.reduce((sum: number, g: any) => sum + g.willPromote, 0)} คน
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={handleConfirmRollover}
                      disabled={actionLoading || data.summary.totalRemaining <= 0 || data.gradeAnalysis.reduce((sum: number, g: any) => sum + g.willPromote, 0) === 0}
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
                    >
                      {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      ยืนยันเลื่อนสิทธิ์ตามระบบแนะนำ
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: INDIVIDUAL GUIDANCE */}
              {activeTab === "individual" && (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-sm text-indigo-950">
                    <p className="font-bold">📋 ข้อมูลประกอบการพิจารณาคิวสำรองทีละคน:</p>
                    <p className="text-xs text-indigo-800 mt-1">
                      แสดงลำดับเวลาที่สมัครก่อน-หลัง พร้อมคำแนะนำว่านักเรียนสามารถใช้โควตาของชั้นไหนที่เหลืออยู่ หรือกรณีที่โควตารวมเต็มแล้ว แอดมินสามารถตัดสินใจพิจารณากดรับเป็นรายคนได้ครับ
                    </p>
                  </div>

                  {data.waitlistedStudents.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                      {data.waitlistedStudents.map((st: any) => (
                        <div key={st.registrationId} className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-mono font-bold text-xs">
                                คิวสำรองที่ #{st.queueNumber}
                              </span>
                              <h4 className="font-bold text-slate-900 text-base">{st.name}</h4>
                              <span className="text-xs font-semibold text-slate-500">({st.gradeRoom})</span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              <span>สมัครเมื่อ: {formatDateTime(st.createdAt)}</span>
                            </div>

                            <div className="mt-2 pt-1">
                              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold ${
                                st.adviceType === "VACANT_OWN" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                st.adviceType === "ROLLOVER_DONOR" ? "bg-teal-50 text-teal-700 border border-teal-200" :
                                st.adviceType === "FULL_TOTAL" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                                "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}>
                                {st.adviceText}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleIndividualAccept(st.registrationId, st.name)}
                            disabled={actionLoading}
                            className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
                          >
                            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            รับสิทธิ์คนนี้ (Accept)
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      ไม่มีนักเรียนในรายชื่อสำรองขณะนี้
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
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  )
}
