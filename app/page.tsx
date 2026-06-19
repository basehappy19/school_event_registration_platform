import Image from "next/image"
import Link from "next/link"
import { Calendar, Users, ArrowRight } from "lucide-react"
import prisma from "@/lib/prisma"

export const revalidate = 60 // Revalidate every minute

export default async function Home() {
  const projects = await prisma.project.findMany({
    where: { isPublished: true },
    orderBy: { startDate: 'asc' },
    include: {
      _count: {
        select: { registrations: true }
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
            <span className="font-bold text-slate-800 text-xl tracking-tight">SchoolEvents</span>
          </div>
          <nav>
            <Link href="/admin/login" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
              Admin Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
            Discover & Register for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">School Events</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Browse upcoming camps, clubs, and activities. Secure your spot easily with your Student ID—no account creation required!
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-lg font-medium text-slate-700">No active events found.</p>
              <p className="text-sm mt-1">Check back later for new opportunities!</p>
            </div>
          ) : (
            projects.map(project => (
              <div key={project.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-100 transition-all duration-300 group flex flex-col transform hover:-translate-y-1">
                <div className="h-48 bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-6 border-b border-slate-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-slate-100/[0.2] bg-[size:20px_20px]"></div>
                  <h3 className="text-2xl font-bold text-slate-800 text-center line-clamp-3 relative z-10 group-hover:text-indigo-700 transition-colors">
                    {project.title}
                  </h3>
                </div>
                <div className="p-6 flex-1 flex flex-col bg-white">
                  <p className="text-slate-600 text-sm mb-6 line-clamp-2 flex-1">
                    {project.description || "Join this exciting event! Click to view more details and secure your registration."}
                  </p>
                  
                  <div className="space-y-3 mb-8 bg-slate-50 p-4 rounded-xl">
                    <div className="flex items-center text-sm font-medium text-slate-700 gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span>{new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-sm font-medium text-slate-700 gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <span>{project._count.registrations} students registered</span>
                    </div>
                  </div>

                  <Link 
                    href={`/detail/${project.id}`}
                    className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow group-hover:bg-indigo-700"
                  >
                    View Details & Register
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
