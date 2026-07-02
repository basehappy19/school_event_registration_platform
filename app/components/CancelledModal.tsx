"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"

function CancelledModalContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get("cancelled") === "1") {
      setIsOpen(true)
    }
  }, [searchParams])

  const handleClose = () => {
    setIsOpen(false)
    router.replace("/")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">สละสิทธิ์เรียบร้อยแล้ว</h3>
        <p className="text-slate-600 mb-6 text-sm sm:text-base leading-relaxed">
          ระบบได้ทำการยกเลิกการลงทะเบียนของนักเรียน และคืนสิทธิ์ที่นั่งให้กับโครงการเรียบร้อยแล้ว หากต้องการลงทะเบียนกิจกรรมอื่น สามารถเลือกจากรายการด้านล่างได้ทันที
        </p>
        <button
          onClick={handleClose}
          className="w-full bg-slate-900 hover:bg-black text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-md shadow-slate-900/10 cursor-pointer active:scale-95"
        >
          ตกลง รับทราบ
        </button>
      </div>
    </div>
  )
}

export default function CancelledModal() {
  return (
    <Suspense fallback={null}>
      <CancelledModalContent />
    </Suspense>
  )
}
