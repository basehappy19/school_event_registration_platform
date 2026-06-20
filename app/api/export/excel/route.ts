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

  project.registrations.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'APPROVED' ? -1 : 1;
    const sA = a.studentProfile;
    const sB = b.studentProfile;
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

  // Create workbook
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "School Event System"
  
  // Sheet 1: ตัวจริง
  const ws1 = workbook.addWorksheet("รายชื่อตัวจริง")
  
  // Add Project Title
  ws1.mergeCells('A1:D1')
  ws1.getCell('A1').value = `รายชื่อผู้มีสิทธิ์เข้าร่วมโครงการ: ${project.title}`
  ws1.getCell('A1').font = { size: 16, bold: true }
  ws1.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' }

  // Add Headers
  ws1.addRow(["ลำดับ", "ระดับชั้น", "เลขที่", "ชื่อ - นามสกุล"])
  ws1.getRow(2).font = { bold: true }
  ws1.getRow(2).alignment = { vertical: 'middle', horizontal: 'center' }
  
  // Set Column Widths
  ws1.getColumn(1).width = 10
  ws1.getColumn(1).alignment = { horizontal: 'center' }
  ws1.getColumn(2).width = 15 // ระดับชั้น
  ws1.getColumn(2).alignment = { horizontal: 'center' }
  ws1.getColumn(3).width = 10 // เลขที่
  ws1.getColumn(3).alignment = { horizontal: 'center' }
  ws1.getColumn(4).width = 40 // ชื่อ - นามสกุล

  // Add Data
  const approved = project.registrations.filter(r => r.status === 'APPROVED')
  approved.forEach((reg, index) => {
    ws1.addRow([
      index + 1,
      `ม.${reg.studentProfile.grade}/${reg.studentProfile.room}`,
      reg.studentProfile.number,
      `${reg.studentProfile.prefix}${reg.studentProfile.firstName} ${reg.studentProfile.lastName}`
    ])
  })

  // Sheet 2: สำรอง
  const waitlisted = project.registrations.filter(r => r.status === 'WAITLISTED')
  if (waitlisted.length > 0) {
    const ws2 = workbook.addWorksheet("รายชื่อสำรอง")
    
    // Add Project Title
    ws2.mergeCells('A1:D1')
    ws2.getCell('A1').value = `รายชื่อสำรองโครงการ: ${project.title}`
    ws2.getCell('A1').font = { size: 16, bold: true }
    ws2.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' }

    // Add Headers
    ws2.addRow(["ลำดับ", "ระดับชั้น", "เลขที่", "ชื่อ - นามสกุล"])
    ws2.getRow(2).font = { bold: true }
    ws2.getRow(2).alignment = { vertical: 'middle', horizontal: 'center' }
    
    // Set Column Widths
    ws2.getColumn(1).width = 10
    ws2.getColumn(1).alignment = { horizontal: 'center' }
    ws2.getColumn(2).width = 15 // ระดับชั้น
    ws2.getColumn(2).alignment = { horizontal: 'center' }
    ws2.getColumn(3).width = 10 // เลขที่
    ws2.getColumn(3).alignment = { horizontal: 'center' }
    ws2.getColumn(4).width = 40 // ชื่อ - นามสกุล

    waitlisted.forEach((reg, index) => {
      ws2.addRow([
        index + 1,
        `ม.${reg.studentProfile.grade}/${reg.studentProfile.room}`,
        reg.studentProfile.number,
        `${reg.studentProfile.prefix}${reg.studentProfile.firstName} ${reg.studentProfile.lastName}`
      ])
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()

  // Clean title for filename
  const cleanTitle = project.title.replace(/[^a-z0-9ก-๙]/gi, '_').substring(0, 30)

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Registrations.xlsx"; filename*=UTF-8''Registrations_${encodeURIComponent(cleanTitle)}.xlsx`,
    }
  })
}
