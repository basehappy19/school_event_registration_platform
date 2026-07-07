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
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid black; padding: 8px 10px; font-size: 14px; line-height: 1.6; font-weight: normal; vertical-align: middle; }
            th { font-weight: bold; }
            tr { page-break-inside: avoid; }
            h1, h2, h3, p, span, div, th, td { line-height: 1.6 !important; }
          }
          /* Screen styles */
          table.screen-table { width: 100%; border-collapse: collapse; }
          table.screen-table th, table.screen-table td { border: 1px solid black; padding: 8px 10px; font-size: 14px; line-height: 1.6; font-weight: normal; vertical-align: middle; }
          table.screen-table th { font-weight: bold; }
          h1, h2, h3, p, span, div, th, td { line-height: 1.6; }
        `}} />
        
        <div className="p-8 print:p-0 max-w-4xl mx-auto print:max-w-none">
          <div className="text-center mb-6 mt-8 print:mt-0">
            <h1 className="text-lg font-bold mb-3 leading-relaxed pt-2">ประกาศรายชื่อผู้มีสิทธิ์เข้าติวเสริม</h1>
            <h2 className="text-lg font-bold mb-2 leading-relaxed pt-1">{project.title}</h2>
            {project.description && (
              <p className="text-lg font-bold text-black mb-3 max-w-4xl mx-auto whitespace-pre-wrap leading-relaxed pt-1">
                {project.description}
              </p>
            )}
            
            <p className="text-base leading-relaxed pt-1">
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
