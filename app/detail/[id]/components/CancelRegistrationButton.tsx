"use client"

import { useState, useEffect } from "react"
import { cancelRegistration } from "@/app/actions/registration"
import { useRouter } from "next/navigation"
import { Loader2, XCircle, CheckCircle2, AlertCircle } from "lucide-react"

export default function CancelRegistrationButton({ 
  registrationId, 
  canStudentCancel = true, 
  isAdmin = false 
}: { 
  registrationId: string
  canStudentCancel?: boolean
  isAdmin?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState("")
  const [reasonError, setReasonError] = useState("")
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null)

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

  const handleCancel = async () => {
    if (!reason.trim()) {
      setReasonError("กรุณากรอกเหตุผลในการสละสิทธิ์")
      return
    }

    setLoading(true)
    setShowModal(false)
    
    const res = await cancelRegistration(registrationId, reason.trim())
    if (res && 'error' in res) {
      showToast("เกิดข้อผิดพลาด: " + res.error, 'error')
      setLoading(false)
    } else {
      router.push(res && 'projectId' in res && res.projectId ? `/detail/${res.projectId}?cancelled=1` : "/?cancelled=1")
      router.refresh()
    }
  }

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg border text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-200 ${
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

      {!canStudentCancel ? (
        <div className="mt-4 p-5 rounded-2xl bg-rose-50/80 border border-rose-200/80 text-slate-700 text-sm animate-in fade-in duration-200">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="text-left space-y-1.5 flex-1">
              <p className="font-bold text-slate-900 text-base">ไม่สามารถสละสิทธิ์ได้</p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                เนื่องจากไม่อยู่ในช่วงเวลาที่กำหนด
              </p>
              <div className="pt-2 mt-2 border-t border-rose-200/60">
                <span className="text-xs sm:text-sm font-bold text-rose-700">
                  * หากต้องการสละสิทธิ์ ติดต่อครูปูนาเท่านั้น
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => {
            setReason("")
            setReasonError("")
            setShowModal(true)
          }}
          disabled={loading}
          className="flex items-center justify-center w-full bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 font-semibold py-4 px-6 rounded-xl transition-all mt-4 border border-rose-200 cursor-pointer shadow-2xs hover:shadow-sm active:scale-[0.99]"
        >
          <XCircle className="w-5 h-5 mr-3" />
          สละสิทธิ์การเข้าร่วมกิจกรรม
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">ยืนยันการสละสิทธิ์</h3>
            <p className="text-slate-600 mb-4 text-sm">
              นักเรียนแน่ใจหรือไม่ที่ต้องการสละสิทธิ์? หากเปลี่ยนใจจะต้องทำการลงทะเบียนใหม่ (ถ้ายังมีที่นั่งว่าง)
            </p>

            <div className="mb-6 text-left">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>เหตุผลในการสละสิทธิ์ <span className="text-rose-500">* (จำเป็นต้องกรอก)</span></span>
                {reasonError && <span className="text-rose-600 text-xs font-medium">{reasonError}</span>}
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                  if (e.target.value.trim()) setReasonError("")
                }}
                rows={3}
                placeholder="เช่น ติดภารกิจด่วน, ไม่สะดวกเข้าร่วม, ป่วย..."
                className={`w-full p-3 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  reasonError 
                    ? "border-rose-300 bg-rose-50/50 focus:ring-rose-500/20 focus:border-rose-500" 
                    : "border-slate-200 bg-slate-50 focus:ring-rose-500/20 focus:border-rose-500"
                }`}
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowModal(false)
                  setReasonError("")
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ยืนยันการสละสิทธิ์"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
