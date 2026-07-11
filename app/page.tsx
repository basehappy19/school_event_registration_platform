import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"

export const revalidate = 60

export default async function Home({ searchParams }: { searchParams?: Promise<{ cancelled?: string }> }) {
  const resolvedParams = searchParams ? await searchParams : {}
  let project = await prisma.project.findFirst({
    where: { isPublished: true },
    orderBy: [
      { order: 'asc' },
      { id: 'desc' }
    ],
    select: { id: true }
  })

  if (!project) {
    project = await prisma.project.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true }
    })
  }

  if (project) {
    if (resolvedParams.cancelled === '1') {
      redirect(`/detail/${project.id}?cancelled=1`)
    }
    redirect(`/detail/${project.id}`)
  }

  redirect('/admin/login')
}
