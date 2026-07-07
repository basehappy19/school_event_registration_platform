import ExcelJS from 'exceljs'
import { formatThaiDateWithDay, formatTimeRange } from "@/lib/dateUtils"

export function formatExportFilename(title: string, description?: string | null, ext: string = 'pdf'): string {
  let name = title || 'project'
  if (description && description.trim()) {
    name += ` ${description.trim()}`
  }
  name = name.replace(/[\/\\]/g, '_').replace(/[:*?"<>|\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
  return `ประกาศรายชื่อ_${name}.${ext}`
}

export async function exportToExcel(registrations: any[], projectName: string) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Registrations')

  sheet.columns = [
    { header: 'ID', key: 'id', width: 20 },
    { header: 'Student ID', key: 'studentIdInput', width: 15 },
    { header: 'Prefix', key: 'prefix', width: 10 },
    { header: 'First Name', key: 'firstName', width: 20 },
    { header: 'Last Name', key: 'lastName', width: 20 },
    { header: 'Grade', key: 'grade', width: 10 },
    { header: 'Room', key: 'room', width: 10 },
    { header: 'Number', key: 'number', width: 10 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Registered At', key: 'createdAt', width: 20 },
  ]

  registrations.forEach(reg => {
    sheet.addRow({
      id: reg.id,
      studentIdInput: reg.studentIdInput,
      prefix: reg.prefix,
      firstName: reg.firstName,
      lastName: reg.lastName,
      grade: reg.grade,
      room: reg.room,
      number: reg.number,
      status: reg.status,
      createdAt: new Date(reg.createdAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = formatExportFilename(projectName, null, 'xlsx')
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportProjectToPDF(project: any) {
  const jsPDFModule = await import('jspdf')
  const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF || jsPDFModule
  const autoTableModule = await import('jspdf-autotable')
  const autoTable = autoTableModule.default || autoTableModule

  const doc = new (jsPDF as any)({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  try {
    const [regRes, boldRes] = await Promise.all([
      fetch('/THSarabun/THSarabunNew.ttf'),
      fetch('/THSarabun/THSarabunNew-Bold.ttf')
    ])
    if (regRes.ok && boldRes.ok) {
      const [regBuf, boldBuf] = await Promise.all([
        regRes.arrayBuffer(),
        boldRes.arrayBuffer()
      ])
      
      const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
        let binary = ''
        const bytes = new Uint8Array(buffer)
        const len = bytes.byteLength
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        return window.btoa(binary)
      }

      doc.addFileToVFS('THSarabunNew.ttf', arrayBufferToBase64(regBuf))
      doc.addFont('THSarabunNew.ttf', 'THSarabunNew', 'normal')

      doc.addFileToVFS('THSarabunNew-Bold.ttf', arrayBufferToBase64(boldBuf))
      doc.addFont('THSarabunNew-Bold.ttf', 'THSarabunNew', 'bold')

      doc.setFont('THSarabunNew')
    }
  } catch (e) {
    console.warn("Failed to load Thai font for PDF:", e)
  }

  const approvedRegs = [...(project.registrations || [])].filter(
    (r: any) => r.status === 'APPROVED' || r.status === 'WAITLISTED'
  )
  
  approvedRegs.sort((a: any, b: any) => {
    const sA = a.studentProfile || {}
    const sB = b.studentProfile || {}
    const gA = parseInt(sA.grade) || 0
    const gB = parseInt(sB.grade) || 0
    if (gA !== gB) return gA - gB
    const rA = parseInt(sA.room) || 0
    const rB = parseInt(sB.room) || 0
    if (rA !== rB) return rA - rB
    const nA = parseInt(sA.number) || 0
    const nB = parseInt(sB.number) || 0
    return nA - nB
  })

  const formattedDate = formatThaiDateWithDay(project.activityDate)
  const timeRange = formatTimeRange(project.activityStartTime, project.activityEndTime)
  const location = project.activityLocation || "โรงเรียนภูเขียว"

  doc.setFontSize(22)
  doc.setFont('THSarabunNew', 'bold')
  doc.text('ประกาศรายชื่อผู้มีสิทธิ์เข้าติวเสริม', 105, 22, { align: 'center' })
  doc.setFontSize(18)
  doc.text(project.title || '', 105, 32, { align: 'center' })

  let currentY = 42
  if (project.description) {
    doc.setFontSize(16)
    doc.setFont('THSarabunNew', 'normal')
    const splitDesc = doc.splitTextToSize(project.description, 170)
    doc.text(splitDesc, 105, currentY, { align: 'center', lineHeightFactor: 1.4 })
    currentY += splitDesc.length * 8 + 4
  }

  doc.setFontSize(16)
  doc.setFont('THSarabunNew', 'normal')
  doc.text(`${formattedDate} เวลา ${timeRange} ณ ${location}`, 105, currentY, { align: 'center' })
  currentY += 12

  const tableData = approvedRegs.length > 0
    ? approvedRegs.map((reg: any, index: number) => {
        const profile = reg.studentProfile || {}
        return [
          index + 1,
          `ม.${profile.grade || '-'}/${profile.room || '-'}`,
          profile.number || '-',
          `${profile.prefix || ''}${profile.firstName || ''} ${profile.lastName || ''}`
        ]
      })
    : [['', '', 'ไม่พบรายชื่อ', '']]

  autoTable(doc, {
    startY: currentY,
    head: [['ลำดับ', 'ชั้น/ห้อง', 'เลขที่', 'ชื่อ-นามสกุล']],
    body: tableData,
    styles: {
      font: 'THSarabunNew',
      fontSize: 16,
      cellPadding: { top: 5, right: 3, bottom: 2, left: 3 },
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      valign: 'middle'
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      lineColor: [0, 0, 0],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { halign: 'center', cellWidth: 30 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'left' }
    },
    margin: { left: 15, right: 15 },
    theme: 'grid'
  })

  doc.save(formatExportFilename(project.title, project.description, 'pdf'))
}

export async function exportToPDF(registrations: any[], projectName: string) {
  const jsPDFModule = await import('jspdf')
  const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF || jsPDFModule
  const autoTableModule = await import('jspdf-autotable')
  const autoTable = autoTableModule.default || autoTableModule

  const doc = new (jsPDF as any)({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  try {
    const [regRes, boldRes] = await Promise.all([
      fetch('/THSarabun/THSarabunNew.ttf'),
      fetch('/THSarabun/THSarabunNew-Bold.ttf')
    ])
    if (regRes.ok && boldRes.ok) {
      const [regBuf, boldBuf] = await Promise.all([
        regRes.arrayBuffer(),
        boldRes.arrayBuffer()
      ])
      
      const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
        let binary = ''
        const bytes = new Uint8Array(buffer)
        const len = bytes.byteLength
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        return window.btoa(binary)
      }

      doc.addFileToVFS('THSarabunNew.ttf', arrayBufferToBase64(regBuf))
      doc.addFont('THSarabunNew.ttf', 'THSarabunNew', 'normal')

      doc.addFileToVFS('THSarabunNew-Bold.ttf', arrayBufferToBase64(boldBuf))
      doc.addFont('THSarabunNew-Bold.ttf', 'THSarabunNew', 'bold')

      doc.setFont('THSarabunNew')
    }
  } catch (e) {
    console.warn("Failed to load Thai font for PDF:", e)
  }

  doc.setFontSize(20)
  doc.setFont('THSarabunNew', 'bold')
  doc.text(`Registrations for ${projectName}`, 105, 20, { align: 'center' })

  const tableData = registrations.map((reg: any, index: number) => [
    index + 1,
    reg.studentIdInput || '-',
    `${reg.prefix || ''}${reg.firstName || ''} ${reg.lastName || ''}`,
    `ม.${reg.grade || '-'}/${reg.room || '-'}`,
    reg.number || '-',
    reg.status || '-'
  ])

  autoTable(doc, {
    startY: 30,
    head: [['No.', 'Student ID', 'Name', 'Grade/Room', 'Number', 'Status']],
    body: tableData,
    styles: {
      font: 'THSarabunNew',
      fontSize: 15,
      cellPadding: { top: 5, right: 3, bottom: 2, left: 3 },
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      valign: 'middle'
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      lineColor: [0, 0, 0],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'center', cellWidth: 30 },
      3: { halign: 'center', cellWidth: 25 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 25 }
    },
    margin: { left: 15, right: 15 },
    theme: 'grid'
  })

  doc.save(formatExportFilename(projectName, null, 'pdf'))
}
