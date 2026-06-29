"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Copy } from "lucide-react"
import Image from "next/image"

export default function LineBrowserWarning() {
  const [isInLine, setIsInLine] = useState(false)
  const [url, setUrl] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as Window & typeof globalThis & { opera?: string }).opera || "";
    const isLine = /Line/i.test(userAgent);
    const isInAppBrowser = /FBAN|FBAV|Instagram|IGApp|TikTok|trill|Twitter|LinkedInApp/i.test(userAgent) || isLine;
    
    if (isInAppBrowser) {
      // Use setTimeout to avoid synchronous setState inside useEffect warning
      setTimeout(() => {
        setIsInLine(true);
        const currentUrl = window.location.href;
        setUrl(currentUrl);
      }, 0);
      
      const currentUrl = window.location.href;
      // 1. LINE's built-in parameter (Works on both Android and iOS LINE)
      if (isLine && !currentUrl.includes('openExternalBrowser=1')) {
        const hasAttempted = sessionStorage.getItem('lineRedirectAttempted');
        if (!hasAttempted) {
          sessionStorage.setItem('lineRedirectAttempted', 'true');
          window.location.href = currentUrl + (currentUrl.includes('?') ? '&' : '?') + 'openExternalBrowser=1';
          return;
        }
      }

      // 2. Android Chrome Intent (Works for FB, IG, TikTok, etc. on Android)
      const isAndroid = /android/i.test(userAgent);
      if (isAndroid) {
        const hasIntentAttempted = sessionStorage.getItem('androidIntentAttempted');
        if (!hasIntentAttempted) {
          sessionStorage.setItem('androidIntentAttempted', 'true');
          const urlWithoutHttp = currentUrl.replace(/^https?:\/\//i, '');
          const intentUrl = `intent://${urlWithoutHttp}#Intent;scheme=https;package=com.android.chrome;end`;
          window.location.href = intentUrl;
        }
      }
    }
  }, []);

  if (!isInLine) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" style={{ zIndex: 99999 }}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">ไม่สามารถเข้าสู่ระบบได้</h3>
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">
          เพื่อความปลอดภัยของบัญชี Google ไม่อนุญาตให้ล็อกอินผ่านเบราว์เซอร์ภายในแอป (เช่น LINE, Facebook)
        </p>
        
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left shadow-inner">
          <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs shrink-0">1</span>
            กดที่ไอคอน <strong className="mx-1 px-2 py-0.5 bg-slate-200 rounded">⋮</strong> มุมขวาบนของจอ
          </p>
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs shrink-0">2</span>
            เลือก <strong className="text-indigo-600 mx-1">เปิดเบราว์เซอร์เริ่มต้น</strong>
          </p>
          <p className="text-xs text-slate-500 ml-8 mt-1">(หรือ Open in Default Browser / Safari)</p>
          <div className="flex justify-center gap-4 mt-4">
            <Image src="/icons/safari_ios_browser_logo_icon_152966.png" alt="Safari" width={28} height={28} className="object-contain" />
            <Image src="/icons/googlechrome_103832.png" alt="Chrome" width={28} height={28} className="object-contain" />
            <Image src="/icons/edge_browser_logo_icon_152998.png" alt="Edge" width={28} height={28} className="object-contain" />
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">หรือ</span>
          </div>
        </div>

        <button 
          onClick={() => {
            navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 3000)
          }}
          className="mt-6 w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3.5 font-medium transition-colors flex items-center justify-center gap-2"
        >
          {copied ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          {copied ? "คัดลอกลิงก์สำเร็จ!" : "คัดลอกลิงก์ไปเปิดใน Chrome/Safari"}
        </button>
      </div>
    </div>
  )
}

function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
