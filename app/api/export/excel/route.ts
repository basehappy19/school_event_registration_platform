import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import ExcelJS from "exceljs"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session || ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get("projectId")

  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 })
  }

  const project = await prisma.project.findUnique({
    where: { id: parseInt(projectId, 10) },
    include: {
      registrations: {
        where: {
          status: { in: ['APPROVED', 'WAITLISTED'] }
        },
        include: {
          studentProfile: true
        },
        orderBy: [
          { status: 'asc' }, // APPROVED first
          { studentProfile: { grade: 'asc' } },
          { studentProfile: { room: 'asc' } },
          { studentProfile: { number: 'asc' } }
        ]
      }
    }
  })

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  // Create workbook
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "School Event System"
  
  // Sheet 1: ตัวจริง
  const ws1 = workbook.addWorksheet("รายชื่อตัวจริง")
  ws1.columns = [
    { header: "รหัสนักเรียน", key: "studentId", width: 15 },
    { header: "ชื่อ - นามสกุล", key: "fullName", width: 40 },
    { header: "ระดับชั้น", key: "gradeRoom", width: 15 },
    { header: "เลขที่", key: "number", width: 10 }
  ]

  // Add Data
  const approved = project.registrations.filter(r => r.status === 'APPROVED')
  for (const reg of approved) {
    ws1.addRow({
      studentId: reg.studentProfile.studentId,
      fullName: `${reg.studentProfile.prefix}${reg.studentProfile.firstName} ${reg.studentProfile.lastName}`,
      gradeRoom: `ม.${reg.studentProfile.grade}/${reg.studentProfile.room}`,
      number: reg.studentProfile.number
    })
  }

  // Sheet 2: สำรอง
  const waitlisted = project.registrations.filter(r => r.status === 'WAITLISTED')
  if (waitlisted.length > 0) {
    const ws2 = workbook.addWorksheet("รายชื่อสำรอง")
    ws2.columns = [
      { header: "รหัสนักเรียน", key: "studentId", width: 15 },
      { header: "ชื่อ - นามสกุล", key: "fullName", width: 40 },
      { header: "ระดับชั้น", key: "gradeRoom", width: 15 },
      { header: "เลขที่", key: "number", width: 10 }
    ]

    for (const reg of waitlisted) {
      ws2.addRow({
        studentId: reg.studentProfile.studentId,
        fullName: `${reg.studentProfile.prefix}${reg.studentProfile.firstName} ${reg.studentProfile.lastName}`,
        gradeRoom: `ม.${reg.studentProfile.grade}/${reg.studentProfile.room}`,
        number: reg.studentProfile.number
      })
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()

  // Clean title for filename
  const cleanTitle = project.title.replace(/[^a-z0-9ก-๙]/gi, '_').substring(0, 30)

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Registrations_${cleanTitle}.xlsx"`,
    }
  })
}
