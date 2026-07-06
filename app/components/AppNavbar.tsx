import Link from "next/link"
import Image from "next/image"
import { auth } from "@/auth"
import { LayoutDashboard, LogOut, Lock, User } from "lucide-react"
import { signOutAction } from "@/app/actions/auth"

export default async function AppNavbar() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all print:hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Image src="/logo.png" alt="Logo" width={36} height={36} className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-sm shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 min-w-0 leading-tight">
            <span className="font-bold text-slate-900 text-sm sm:text-lg tracking-tight truncate">โรงเรียนภูเขียว</span>
            <span className="text-[11px] sm:text-sm font-medium text-slate-500 truncate">ระบบลงทะเบียนกิจกรรม</span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {isAdmin ? (
            <>
              <Link 
                href="/admin" 
                className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold bg-indigo-50/90 text-indigo-600 hover:bg-indigo-100 border border-indigo-200/80 transition-all shadow-2xs"
                title="เข้าสู่ระบบหลังบ้าน"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>หลังบ้าน</span>
              </Link>

              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="max-w-[150px] truncate">{session?.user?.email}</span>
              </div>

              <form action={signOutAction}>
                <button 
                  type="submit" 
                  className="inline-flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span className="hidden sm:inline">ออกจากระบบ</span>
                </button>
              </form>
            </>
          ) : (
            <Link 
              href="/admin/login" 
              className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition-all shadow-2xs"
              title="สำหรับผู้ดูแลระบบ"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="hidden sm:inline">สำหรับผู้ดูแลระบบ</span>
              <span className="sm:hidden">แอดมิน</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
