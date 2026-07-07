import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { Metadata } from "next"
import AdminPrintContent from "./components/AdminPrintContent"
import { formatExportFilename } from "@/lib/export"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  
  const project = await prisma.project.findUnique({
    where: { id },
    select: { title: true, description: true }
  })

  if (!project) return {}

  return {
    title: formatExportFilename(project.title, project.description, 'pdf').replace('.pdf', ''),
  }
}

export default async function AdminPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"

  if (!isAdmin) {
    redirect("/admin/login")
  }

  const { id } = await params
  
  if (!id) return notFound()

  const project = await prisma.project.findUnique({
    where: { id }
  })

  if (!project) return notFound()

  const registrations = await prisma.registration.findMany({
    where: {
      projectId: id,
      status: { in: ['APPROVED', 'WAITLISTED'] }
    },
    include: {
      studentProfile: true
    }
  })

  registrations.sort((a, b) => {
    const sA = a.studentProfile || {};
    const sB = b.studentProfile || {};
    const gA = parseInt(sA.grade) || 0;
    const gB = parseInt(sB.grade) || 0;
    if (gA !== gB) return gA - gB;
    const rA = parseInt(sA.room) || 0;
    const rB = parseInt(sB.room) || 0;
    if (rA !== rB) return rA - rB;
    const nA = parseInt(sA.number) || 0;
    const nB = parseInt(sB.number) || 0;
    return nA - nB;
  });

  return <AdminPrintContent project={project} registrations={registrations} />
}
