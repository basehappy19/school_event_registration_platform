import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// In-memory store for active viewers
// Structure: { projectId: { sessionId: lastSeenTimestamp } }
const globalForViewers = global as unknown as { 
  activeViewers: Record<number, Record<string, number>>,
  cachedStats: Record<number, { data: any, timestamp: number }>
}
const activeViewers = globalForViewers.activeViewers || {}
const cachedStats = globalForViewers.cachedStats || {}

if (process.env.NODE_ENV !== 'production') {
  globalForViewers.activeViewers = activeViewers
  globalForViewers.cachedStats = cachedStats
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const projectId = parseInt(id, 10)
  if (isNaN(projectId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId')

  const now = Date.now()
  if (sessionId) {
    if (!activeViewers[projectId]) activeViewers[projectId] = {}
    activeViewers[projectId][sessionId] = now
  }

  // Clean up old sessions (> 6 seconds)
  if (activeViewers[projectId]) {
    for (const sid in activeViewers[projectId]) {
      if (now - activeViewers[projectId][sid] > 6000) {
        delete activeViewers[projectId][sid]
      }
    }
  }

  const viewersCount = activeViewers[projectId] ? Object.keys(activeViewers[projectId]).length : 0

  // In-Memory Cache (TTL 5 seconds) to prevent DB overload during high concurrency
  const CACHE_TTL = 5000;
  let statsData = cachedStats[projectId]?.data;
  
  if (!statsData || (now - cachedStats[projectId].timestamp > CACHE_TTL)) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        quotas: { select: { grade: true, capacity: true } },
        registrations: {
          where: { status: { in: ['APPROVED', 'WAITLISTED'] } },
          select: {
            studentProfile: { select: { grade: true } }
          }
        }
      }
    })

    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const totalCapacity = project.quotas.reduce((acc, q) => acc + q.capacity, 0)
    const totalRegistered = project.registrations.length
    const gradeStats = project.quotas.map(q => ({
      grade: q.grade,
      capacity: q.capacity,
      registered: project.registrations.filter(r => r.studentProfile?.grade === q.grade).length
    })).sort((a, b) => Number(a.grade) - Number(b.grade))

    statsData = { totalCapacity, totalRegistered, gradeStats }
    cachedStats[projectId] = { data: statsData, timestamp: now }
  }

  return NextResponse.json({
    totalCapacity: statsData.totalCapacity,
    totalRegistered: statsData.totalRegistered,
    gradeStats: statsData.gradeStats,
    viewersCount
  })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const projectId = parseInt(id, 10)
  if (isNaN(projectId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 })

  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId')
  const action = url.searchParams.get('action')

  if (action === 'leave' && sessionId && activeViewers[projectId]) {
    delete activeViewers[projectId][sessionId]
  }

  return NextResponse.json({ success: true })
}
