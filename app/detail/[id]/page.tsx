import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import RegistrationWizard from "./components/RegistrationWizard"
import ViewerTracker from "./components/ViewerTracker"
import AppNavbar from "@/app/components/AppNavbar"
import { auth } from "@/auth"
import { unstable_cache } from "next/cache"

import { Metadata } from "next"

const getCachedProjectMeta = unstable_cache(
  async (id: string) => {
    return await prisma.project.findUnique({
      where: { id },
      select: { title: true, description: true, posterUrl: true }
    })
  },
  ['project-meta'],
  { revalidate: 30 }
)

const getCachedProject = unstable_cache(
  async (id: string) => {
    return await prisma.project.findUnique({
      where: { id },
      include: {
        formFields: true,
        quotas: {
          orderBy: { grade: 'asc' }
        }
      }
    })
  },
  ['project-detail'],
  { revalidate: 30 }
)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  
  const project = await getCachedProjectMeta(id)

  if (!project) return {}

  const images = project.posterUrl ? [project.posterUrl] : ["/school_event_registration_platform_banner.jpg"]

  return {
    title: project.title,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description || undefined,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.description || undefined,
      images,
    }
  }
}

export default async function ProjectDetail({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ error?: string }> }) {
  const { id } = await params
  const { error } = await searchParams
  
  const project = await getCachedProject(id)

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
          studentId: profile.studentId
        }
      })

      if (existingReg && existingReg.status !== 'CANCELLED') {
        // Redirect to success page if already registered and not cancelled
        const { redirect } = await import("next/navigation")
        redirect(`/detail/${id}/success`)
      }
    }
  }

  return (
    <>
      <AppNavbar />
      <div className="min-h-screen bg-transparent font-sans selection:bg-indigo-100 selection:text-indigo-900 py-0 sm:py-12 px-0 sm:px-6 lg:px-8">
        <ViewerTracker projectId={project.id} />
        <div className="max-w-5xl mx-auto">
          <RegistrationWizard project={project} session={session} profile={profile} errorParam={error} />
        </div>
      </div>
    </>
  )
}
