"use client"

import { useState } from "react"
import { cancelRegistration } from "@/app/actions/registration"
import { useRouter } from "next/navigation"
import { Loader2, XCircle } from "lucide-react"

export default function CancelRegistrationButton({ registrationId }: { registrationId: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ที่ต้องการสละสิทธิ์? การกระทำนี้ไม่สามารถย้อนกลับได้")) return
    
    setLoading(true)
    const res = await cancelRegistration(registrationId)
    
    if (res?.error) {
      alert("เกิดข้อผิดพลาด: " + res.error)
      setLoading(false)
    } else {
      router.push("/")
    }
  }

  return (
    <button 
      onClick={handleCancel}
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
  )
}
