import Link from "next/link"
import { SearchX, ArrowLeft } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "404 - ไม่พบหน้าเว็บ",
  description: "ขออภัย เราไม่พบหน้าที่คุณกำลังพยายามเข้าถึง",
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-md w-full text-center">
        {/* Animated Icon */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20"></div>
          <div className="absolute inset-0 bg-indigo-50 rounded-full flex items-center justify-center shadow-sm border border-indigo-100">
            <SearchX className="w-14 h-14 text-indigo-500" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4 mb-10">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">404</h1>
          <h2 className="text-2xl font-bold text-slate-800 bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-pink-500">
            ไม่พบหน้าที่คุณค้นหา
          </h2>
          <p className="text-slate-500 leading-relaxed max-w-sm mx-auto">
            ขออภัย เราไม่พบหน้าที่คุณกำลังพยายามเข้าถึง หน้าเว็บนี้อาจถูกลบ ย้าย หรือคุณอาจพิมพ์ URL ผิด
          </p>
        </div>

        {/* Action Buttons */}
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  )
}
