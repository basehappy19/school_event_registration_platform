import Image from "next/image"
import Link from "next/link"
import prisma from "@/lib/prisma"
import ProjectGrid from "./components/ProjectGrid"
import { auth } from "@/auth"

export const revalidate = 60 // Revalidate every minute

export default async function Home() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  const isAdmin = session && (role === "ADMIN" || role === "SUPER_ADMIN")

  const projects = await prisma.project.findMany({
    where: { isPublished: true },
    orderBy: { id: 'desc' },
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Image src="/logo.png" alt="Logo" width={36} height={36} className="object-contain shrink-0 w-8 h-8 sm:w-9 sm:h-9" />
            <span className="font-bold text-slate-800 text-lg sm:text-xl tracking-tight truncate">ระบบลงทะเบียนกิจกรรม</span>
          </div>
          <nav className="shrink-0">
            {isAdmin ? (
              <Link href="/admin" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                จัดการระบบ (แอดมิน)
              </Link>
            ) : (
              <Link href="/admin/login" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                เข้าสู่ระบบแอดมิน
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-6 sm:py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 md:mb-16 px-4 sm:px-0">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="Logo" width={120} height={120} className="object-contain w-24 h-24 sm:w-32 sm:h-32 drop-shadow-sm hover:scale-105 transition-transform" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
            โครงการติวเข้ม <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-violet-600">เสริมความรู้มุ่งสู่มหาวิทยาลัย</span>
          </h1>
          <p className="text-[#e72528] text-3xl sm:text-4xl md:text-5xl mt-2 font-extrabold tracking-tight">
            โรงเรียนภูเขียว สพม.ชัยภูมิ
          </p>
        </div>

        {/* Projects Grid with Search */}
        <ProjectGrid projects={projects} />
      </main>
    </div>
  )
}
