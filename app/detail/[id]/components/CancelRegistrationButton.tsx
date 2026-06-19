"use client"

import { useState } from "react"
import { cancelRegistration } from "@/app/actions/registration"
import { useRouter } from "next/navigation"
import { Loader2, XCircle } from "lucide-react"

export default function CancelRegistrationButton({ registrationId }: { registrationId: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const handleCancel = async () => {
    setLoading(true)
    const res = await cancelRegistration(registrationId)
    
    if (res && 'error' in res) {
      alert("เกิดข้อผิดพลาด: " + res.error)
      setLoading(false)
      setShowModal(false)
    } else {
      router.push("/")
    }
  }

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        disabled={loading}
        className="flex items-center justify-center w-full bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 font-semibold py-4 px-6 rounded-xl transition-all mt-4 border border-rose-200"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
        ) : (
          <XCircle className="w-5 h-5 mr-3" />
        )}
        สละสิทธิ์การเข้าร่วมกิจกรรม
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">ยืนยันการสละสิทธิ์</h3>
            <p className="text-slate-600 mb-6 text-sm">
              คุณแน่ใจหรือไม่ที่ต้องการสละสิทธิ์? การกระทำนี้ไม่สามารถย้อนกลับได้ และหากเปลี่ยนใจจะต้องทำการลงทะเบียนใหม่ (ถ้ายังมีที่นั่งว่าง)
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center"
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
