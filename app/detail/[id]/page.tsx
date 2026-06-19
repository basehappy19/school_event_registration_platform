import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import RegistrationWizard from "./components/RegistrationWizard"

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

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <RegistrationWizard project={project} />
      </div>
    </div>
  )
}
