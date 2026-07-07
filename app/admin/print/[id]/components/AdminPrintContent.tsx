"use client"

import AutoPrint from "@/app/announcement/[id]/components/AutoPrint"
import { formatThaiDateWithDay, formatTimeRange } from "@/lib/dateUtils"

export default function AdminPrintContent({ project, registrations }: { project: any, registrations: any[] }) {
  const formattedDate = formatThaiDateWithDay(project.activityDate)

  return (
    <>
      <AutoPrint />
      <div id="print-content" className="bg-white min-h-screen text-black print:p-0 font-sans">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { margin: 15mm; size: A4 portrait; }
            thead { display: table-header-group; }
            * { font-family: 'THSarabunNew', sans-serif !important; }
            table { width: 100%; border-collapse: collapse; overflow: visible !important; }
            tr, th, td { overflow: visible !important; }
            th, td { border: 1px solid black !important; padding: 3px 6px 2px 6px !important; font-size: 13pt !important; line-height: 1.3 !important; font-weight: normal; vertical-align: middle; }
            th { font-weight: bold !important; }
            tr { page-break-inside: avoid; }
            h1 { font-size: 16pt !important; font-weight: bold !important; line-height: 1.3 !important; }
            h2 { font-size: 14pt !important; font-weight: bold !important; line-height: 1.3 !important; }
            p, span, div { font-size: 12pt !important; line-height: 1.3 !important; overflow: visible !important; }
          }
          /* Screen styles */
          #print-content { font-family: 'THSarabunNew', sans-serif !important; }
          table.screen-table { width: 100%; border-collapse: collapse; overflow: visible !important; font-family: 'THSarabunNew', sans-serif !important; }
          table.screen-table tr, table.screen-table th, table.screen-table td { overflow: visible !important; }
          table.screen-table th, table.screen-table td { border: 1px solid black; padding: 3px 6px 2px 6px !important; font-size: 13pt !important; line-height: 1.3 !important; font-weight: normal; vertical-align: middle; }
          table.screen-table th { font-weight: bold !important; }
          #print-content h1 { font-size: 16pt !important; font-weight: bold !important; line-height: 1.3 !important; }
          #print-content h2 { font-size: 14pt !important; font-weight: bold !important; line-height: 1.3 !important; }
          #print-content p, #print-content span, #print-content div { line-height: 1.3 !important; overflow: visible !important; }
        `}} />
        
        <div className="p-8 print:p-0 max-w-4xl mx-auto print:max-w-none">
          <div className="text-center mb-6 mt-8 print:mt-0">
            <h1 className="font-bold mb-2">ประกาศรายชื่อผู้มีสิทธิ์เข้าติวเสริม</h1>
            <h2 className="font-bold mb-2">{project.title}</h2>
            {project.description && (
              <p className="font-bold text-black mb-2 max-w-4xl mx-auto whitespace-pre-wrap">
                {project.description}
              </p>
            )}
            
            <p className="text-base">
              {formattedDate} เวลา {formatTimeRange(project.activityStartTime, project.activityEndTime)} ณ {project.activityLocation || "โรงเรียนภูเขียว"}
            </p>
          </div>

          <table className="screen-table text-left">
            <thead className="bg-white">
              <tr>
                <th className="w-16 text-center">ลำดับ</th>
                <th className="w-24 text-center">ชั้น/ห้อง</th>
                <th className="w-20 text-center">เลขที่</th>
                <th>ชื่อ-นามสกุล</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length > 0 ? (
                registrations.map((reg, index) => {
                  const profile = reg.studentProfile || {};
                  return (
                    <tr key={reg.id}>
                      <td className="text-center">{index + 1}</td>
                      <td className="text-center">ม.{profile.grade || '-'}/{profile.room || '-'}</td>
                      <td className="text-center">{profile.number || '-'}</td>
                      <td>
                        {profile.prefix || ''}{profile.firstName || ''} {profile.lastName || ''}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-4">ไม่พบรายชื่อ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
