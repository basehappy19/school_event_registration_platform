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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={36} height={36} className="object-contain" />
            <span className="font-bold text-slate-800 text-xl tracking-tight">ระบบลงทะเบียนกิจกรรม</span>
          </div>
          <nav>
            <Link href="/admin/login" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              เข้าสู่ระบบแอดมิน
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-6 sm:py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 md:mb-24 px-4 sm:px-0">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
            โครงการติวเข้ม <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-violet-600">เสริมความรู้มุ่งสู่มหาวิทยาลัย</span>
          </h1>
          
        </div>

        {/* Projects Grid with Search */}
        <ProjectGrid projects={projects} />
      </main>
    </div>
  )
}
