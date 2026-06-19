import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import RegistrationWizard from "./components/RegistrationWizard"
import { auth } from "@/auth"

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const project = await prisma.project.findUnique({
    where: { id, isPublished: true },
    include: {
      formFields: true,
      quotas: true
    }
  })

  if (!project) return notFound()

  const session = await auth()
  let profile = null
  if (session?.user?.email) {
    profile = await prisma.studentProfile.findUnique({
      where: { email: session.user.email }
    })

    if (profile) {
      const existingReg = await prisma.registration.findFirst({
        where: {
          projectId: id,
          masterStudentId: profile.studentId
        }
      })

      if (existingReg) {
        // Redirect to success page if already registered
        const { redirect } = await import("next/navigation")
        redirect(`/detail/${id}/success`)
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <RegistrationWizard project={project} session={session} profile={profile} />
      </div>
    </div>
  )
}
