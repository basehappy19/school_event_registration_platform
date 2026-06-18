import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
      createdAt: new Date(reg.createdAt).toLocaleString(),
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName}_Registrations.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportToPDF(registrations: any[], projectName: string) {
  const doc = new jsPDF()
  
  doc.text(`Registrations for ${projectName}`, 14, 15)

  const tableColumn = ["Student ID", "Name", "Grade", "Room", "No.", "Status"]
  const tableRows: any[] = []

  registrations.forEach(reg => {
    const rowData = [
      reg.studentIdInput,
      `${reg.prefix}${reg.firstName} ${reg.lastName}`,
      reg.grade,
      reg.room,
      reg.number,
      reg.status
    ]
    tableRows.push(rowData)
  })

  // Note: For full Thai font support, a custom font needs to be added to jsPDF via addFileToVFS and addFont.
  // Using default helvetica here.
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 20,
    styles: { font: 'helvetica' },
  })

  doc.save(`${projectName}_Registrations.pdf`)
}
