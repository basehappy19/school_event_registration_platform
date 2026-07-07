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

  const container = document.createElement('div')
  const uniqueId = 'pdf-export-container-' + Date.now()
  container.id = uniqueId
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.width = '180mm'
  container.style.fontFamily = "'THSarabunNew', 'Sarabun', sans-serif"
  container.style.color = '#000000'
  container.style.backgroundColor = '#ffffff'

  let tableRowsHtml = ''
  if (approvedRegs.length > 0) {
    approvedRegs.forEach((reg: any, index: number) => {
      const profile = reg.studentProfile || {}
      tableRowsHtml += `
        <tr style="page-break-inside: avoid; break-inside: avoid;">
          <td style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; text-align: center; vertical-align: middle;">${index + 1}</td>
          <td style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; text-align: center; vertical-align: middle;">ม.${profile.grade || '-'}/${profile.room || '-'}</td>
          <td style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; text-align: center; vertical-align: middle;">${profile.number || '-'}</td>
          <td style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; text-align: left; vertical-align: middle;">${profile.prefix || ''}${profile.firstName || ''} ${profile.lastName || ''}</td>
        </tr>
      `
    })
  } else {
    tableRowsHtml = `
      <tr>
        <td colspan="4" style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; text-align: center; vertical-align: middle;">ไม่พบรายชื่อ</td>
      </tr>
    `
  }

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 12px;">
      <h1 style="font-size: 16pt; font-weight: bold; line-height: 1.3; margin: 0 0 4px 0; color: #000000;">ประกาศรายชื่อผู้มีสิทธิ์เข้าติวเสริม</h1>
      <h2 style="font-size: 14pt; font-weight: bold; line-height: 1.3; margin: 0 0 6px 0; color: #000000;">${project.title || ''}</h2>
      ${project.description ? `<div style="font-size: 13pt; line-height: 1.3; margin: 0 0 6px 0; color: #000000;">${project.description}</div>` : ''}
      <div style="font-size: 13pt; line-height: 1.3; margin: 0; color: #000000;">${formattedDate} เวลา ${timeRange} ณ ${location}</div>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <thead>
        <tr style="page-break-inside: avoid; break-inside: avoid;">
          <th style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; font-weight: bold; text-align: center; vertical-align: middle; width: 12%; background-color: #ffffff; color: #000000;">ลำดับ</th>
          <th style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; font-weight: bold; text-align: center; vertical-align: middle; width: 18%; background-color: #ffffff; color: #000000;">ชั้น/ห้อง</th>
          <th style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; font-weight: bold; text-align: center; vertical-align: middle; width: 15%; background-color: #ffffff; color: #000000;">เลขที่</th>
          <th style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; font-weight: bold; text-align: center; vertical-align: middle; width: 55%; background-color: #ffffff; color: #000000;">ชื่อ-นามสกุล</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
    </table>
  `

  document.body.appendChild(container)
  try {
    // @ts-ignore
    const html2pdfModule = await import('html2pdf.js')
    const html2pdf = html2pdfModule.default || html2pdfModule
    const opt: any = {
      margin: 15,
      filename: formatExportFilename(project.title, project.description, 'pdf'),
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        scrollY: 0,
        scrollX: 0,
        onclone: (clonedDoc: Document) => {
          const el = clonedDoc.getElementById(uniqueId)
          if (el) {
            el.style.position = 'relative'
            el.style.left = '0px'
            el.style.top = '0px'
            el.style.margin = '0'
          }
        }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    }
    await html2pdf().set(opt).from(container).save()
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
  }
}

export async function exportToPDF(registrations: any[], projectName: string) {
  const container = document.createElement('div')
  const uniqueId = 'pdf-export-container-' + Date.now()
  container.id = uniqueId
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.width = '180mm'
  container.style.fontFamily = "'THSarabunNew', 'Sarabun', sans-serif"
  container.style.color = '#000000'
  container.style.backgroundColor = '#ffffff'

  let tableRowsHtml = ''
  if (registrations.length > 0) {
    registrations.forEach((reg: any, index: number) => {
      tableRowsHtml += `
        <tr style="page-break-inside: avoid; break-inside: avoid;">
          <td style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; text-align: center; vertical-align: middle;">${index + 1}</td>
          <td style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; text-align: center; vertical-align: middle;">${reg.studentIdInput || '-'}</td>
          <td style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; text-align: left; vertical-align: middle;">${reg.prefix || ''}${reg.firstName || ''} ${reg.lastName || ''}</td>
          <td style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; text-align: center; vertical-align: middle;">ม.${reg.grade || '-'}/${reg.room || '-'}</td>
          <td style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; text-align: center; vertical-align: middle;">${reg.number || '-'}</td>
          <td style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; text-align: center; vertical-align: middle;">${reg.status || '-'}</td>
        </tr>
      `
    })
  } else {
    tableRowsHtml = `
      <tr>
        <td colspan="6" style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; text-align: center; vertical-align: middle;">ไม่พบรายชื่อ</td>
      </tr>
    `
  }

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 12px;">
      <h1 style="font-size: 16pt; font-weight: bold; line-height: 1.3; margin: 0 0 6px 0; color: #000000;">Registrations for ${projectName}</h1>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <thead>
        <tr style="page-break-inside: avoid; break-inside: avoid;">
          <th style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; font-weight: bold; text-align: center; vertical-align: middle; width: 10%; background-color: #ffffff; color: #000000;">No.</th>
          <th style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; font-weight: bold; text-align: center; vertical-align: middle; width: 18%; background-color: #ffffff; color: #000000;">Student ID</th>
          <th style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; font-weight: bold; text-align: center; vertical-align: middle; width: 32%; background-color: #ffffff; color: #000000;">Name</th>
          <th style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; font-weight: bold; text-align: center; vertical-align: middle; width: 15%; background-color: #ffffff; color: #000000;">Grade/Room</th>
          <th style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; font-weight: bold; text-align: center; vertical-align: middle; width: 10%; background-color: #ffffff; color: #000000;">Number</th>
          <th style="border: 1px solid black; padding: 3px 6px 2px 6px; font-size: 13pt; line-height: 1.3; font-weight: bold; text-align: center; vertical-align: middle; width: 15%; background-color: #ffffff; color: #000000;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml}
      </tbody>
    </table>
  `

  document.body.appendChild(container)
  try {
    // @ts-ignore
    const html2pdfModule = await import('html2pdf.js')
    const html2pdf = html2pdfModule.default || html2pdfModule
    const opt: any = {
      margin: 15,
      filename: formatExportFilename(projectName, null, 'pdf'),
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        scrollY: 0,
        scrollX: 0,
        onclone: (clonedDoc: Document) => {
          const el = clonedDoc.getElementById(uniqueId)
          if (el) {
            el.style.position = 'relative'
            el.style.left = '0px'
            el.style.top = '0px'
            el.style.margin = '0'
          }
        }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    }
    await html2pdf().set(opt).from(container).save()
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
  }
}

