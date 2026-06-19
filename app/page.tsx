import Image from "next/image"
import Link from "next/link"
import prisma from "@/lib/prisma"
import ProjectGrid from "./components/ProjectGrid"

export const revalidate = 60 // Revalidate every minute

export default async function Home() {
  const projects = await prisma.project.findMany({
    where: { isPublished: true },
    orderBy: { startDate: 'asc' },
    include: {
      quotas: {
        orderBy: { grade: 'asc' }
      },
      registrations: {
        where: {
          status: {
            in: ['APPROVED', 'WAITLISTED']
          }
        },
        include: {
          studentProfile: true
        }
      }
    }
  })

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-slate-800 text-xl tracking-tight">ระบบลงทะเบียนกิจกรรม</span>
          </div>
          <nav>
            <Link href="/admin/login" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              เข้าสู่ระบบแอดมิน
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
            โครงการติวเข้ม <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">เสริมความรู้มุ่งสู่มหาวิทยาลัย</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            โปรดอ่านรายละเอียดและกฎเกณฑ์การลงทะเบียนให้ครบถ้วน ผู้ที่ลงทะเบียนทันในโควตาจะได้รับสิทธิ์เป็น <strong>"ตัวจริง"</strong> ส่วนผู้ที่ลงทะเบียนหลังจากโควตาเต็มจะอยู่ในสถานะ <strong>"สำรอง" (Waitlist)</strong> ซึ่งจะมีโอกาสได้รับสิทธิ์หากตัวจริงสละสิทธิ์
          </p>
        </div>

        {/* Projects Grid with Search */}
        <ProjectGrid projects={projects} />
      </main>
    </div>
  )
}
