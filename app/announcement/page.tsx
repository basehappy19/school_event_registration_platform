import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function AnnouncementIndexPage() {
  const project = await prisma.project.findFirst({
    where: { isPublished: true },
    orderBy: [
      { order: 'asc' },
      { id: 'desc' }
    ]
  })

  if (project) {
    redirect(`/announcement/${project.id}`)
  } else {
    redirect("/")
  }
}
