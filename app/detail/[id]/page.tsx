import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import RegistrationWizard from "./components/RegistrationWizard"
import { auth } from "@/auth"

import { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const numericId = parseInt(id, 10)
  if (isNaN(numericId)) return {}
  
  const project = await prisma.project.findUnique({
    where: { id: numericId, isPublished: true },
    select: { title: true, description: true }
  })

  if (!project) return {}

  return {
    title: project.title,
    description: project.description
  }
}

export default async function ProjectDetail({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ error?: string }> }) {
  const { id } = await params
  const { error } = await searchParams
  const numericId = parseInt(id, 10)
  if (isNaN(numericId)) return notFound()
  
  const project = await prisma.project.findUnique({
    where: { id: numericId, isPublished: true },
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
          projectId: numericId,
          studentId: profile.studentId
        }
      })

      if (existingReg && existingReg.status !== 'CANCELLED') {
        // Redirect to success page if already registered and not cancelled
        const { redirect } = await import("next/navigation")
        redirect(`/detail/${numericId}/success`)
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 py-0 sm:py-12 px-0 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <RegistrationWizard project={project} session={session} profile={profile} errorParam={error} />
      </div>
    </div>
  )
}
