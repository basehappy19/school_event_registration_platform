import Link from "next/link"
import Image from "next/image"
import AppNavbar from "@/app/components/AppNavbar"
import { ShieldCheck, QrCode, Sparkles, School, ArrowRight, Lock } from "lucide-react"

export const metadata = {
  title: "ระบบลงทะเบียนกิจกรรมและโครงการ - โรงเรียนภูเขียว",
  description: "แพลตฟอร์มรับสมัครและจัดการกิจกรรมพัฒนาผู้เรียน โรงเรียนภูเขียว จังหวัดชัยภูมิ สะดวก รวดเร็ว และปลอดภัยด้วยบัญชี Google Workspace ของโรงเรียน",
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white font-sans selection:bg-indigo-500 selection:text-white flex flex-col justify-between">
      <AppNavbar />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 sm:py-20 relative overflow-hidden">
        {/* Decorative Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-gradient-to-tr from-indigo-500/20 via-violet-500/15 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse duration-10000"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          {/* Logo & Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 text-xs sm:text-sm font-medium shadow-lg animate-fade-in">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>โรงเรียนภูเขียว จังหวัดชัยภูมิ • สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาชัยภูมิ</span>
          </div>

          {/* Main Title */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200 leading-tight sm:leading-tight">
              ระบบลงทะเบียนกิจกรรม <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-emerald-400">
                และโครงการพัฒนาผู้เรียน
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-slate-300 font-normal leading-relaxed">
              แพลตฟอร์มกลางสำหรับจัดการการรับสมัครและตรวจสอบสถานะการเข้าร่วมกิจกรรมของนักเรียนโรงเรียนภูเขียว อย่างเป็นระบบ แม่นยำ และตรวจสอบได้แบบเรียลไทม์
            </p>
          </div>

          {/* How to Access (No project list shown!) */}
          <div className="mt-8 sm:mt-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl text-left max-w-3xl mx-auto transition-all hover:border-white/20 hover:bg-white/[0.07]">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">คำแนะนำในการเข้าลงทะเบียน</h2>
                <p className="text-xs sm:text-sm text-slate-400">ระบบนี้เปิดรับสมัครผ่านลิงก์เฉพาะของแต่ละโครงการ</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
              <div className="space-y-2.5 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 transition-all">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h3 className="font-bold text-white text-base">รับลิงก์สมัคร</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  รับลิงก์หรือสแกน QR Code ของโครงการจากประกาศของโรงเรียน หรือคุณครูประจำวิชา/ฝ่ายกิจกรรม
                </p>
              </div>

              <div className="space-y-2.5 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 transition-all">
                <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h3 className="font-bold text-white text-base">เข้าสู่ระบบ Google</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ใช้อีเมลของโรงเรียน (<span className="text-indigo-300 font-mono">@phukhieo.ac.th</span>) ในการเข้าสู่ระบบเพื่อยืนยันตัวตนอย่างปลอดภัย
                </p>
              </div>

              <div className="space-y-2.5 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 transition-all">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h3 className="font-bold text-white text-base">ตรวจสอบผลทันที</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  กรอกข้อมูลสมัครและตรวจสอบรายชื่อผู้ผ่านการคัดเลือก (ตัวจริง/สำรอง) ได้แบบเรียลไทม์
                </p>
              </div>
            </div>

            {/* Note alert */}
            <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>ปลอดภัยและรักษาความเป็นส่วนตัวตามมาตรฐานโรงเรียน</span>
              </div>
              <Link 
                href="/admin/login" 
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-xs transition-all shadow-lg hover:shadow-indigo-500/25 shrink-0"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>เข้าสู่ระบบแอดมิน</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500 backdrop-blur-md bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-400">โรงเรียนภูเขียว (Phukhieo School)</span>
          </div>
          <div>
            © {new Date().getFullYear()} Phukhieo School Activity Registration Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
