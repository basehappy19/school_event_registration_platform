import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// In-memory store for active viewers
// Structure: { projectId: { sessionId: lastSeenTimestamp } }
const globalForViewers = global as unknown as { activeViewers: Record<number, Record<string, number>> }
const activeViewers = globalForViewers.activeViewers || {}
if (process.env.NODE_ENV !== 'production') globalForViewers.activeViewers = activeViewers

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

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      quotas: { select: { capacity: true } },
      _count: {
        select: {
          registrations: { where: { status: { in: ['APPROVED', 'WAITLISTED'] } } }
        }
      }
    }
  })

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const totalCapacity = project.quotas.reduce((acc, q) => acc + q.capacity, 0)
  const totalRegistered = project._count.registrations

  return NextResponse.json({
    totalCapacity,
    totalRegistered,
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
