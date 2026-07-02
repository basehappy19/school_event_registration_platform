import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic'

let cachedProjects: { data: any; timestamp: number } | null = null
const CACHE_TTL = 3000 // 3 seconds cache TTL

export async function GET() {
  const now = Date.now()
  if (!cachedProjects || (now - cachedProjects.timestamp > CACHE_TTL)) {
    try {
      const projects = await prisma.project.findMany({
        where: { isPublished: true },
        orderBy: [
          { order: 'asc' },
          { id: 'desc' }
        ],
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
      cachedProjects = { data: projects, timestamp: now }
    } catch (error) {
      if (cachedProjects) {
        return NextResponse.json(cachedProjects.data)
      }
      return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
    }
  }

  return NextResponse.json(cachedProjects.data)
}
