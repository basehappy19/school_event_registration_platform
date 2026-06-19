"use client"

import React, { useState } from 'react'
import { exportToExcel, exportToPDF } from '@/lib/export'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { cancelRegistration, approveAllWaitlist } from '@/app/actions/registration'

type Registration = {
  id: string
  projectId: string
  studentIdInput: string
  prefix: string
  firstName: string
  lastName: string
  grade: string
  room: string
  number: string
  status: 'APPROVED' | 'WAITLISTED' | 'REJECTED' | 'CANCELLED'
  createdAt: Date
}

export default function CommandCenter({ 
  registrations, 
  projectName,
  quotaStats,
  projectId
}: { 
  registrations: Registration[]
  projectName: string
  quotaStats: { grade: string, approved: number, waitlisted: number, capacity: number }[]
  projectId: string
}) {
  const [data, setData] = useState<Registration[]>(registrations)
  const [loading, setLoading] = useState(false)

  const handleExportExcel = () => exportToExcel(data.filter(r => r.status === 'APPROVED'), projectName)
  const handleExportPDF = () => exportToPDF(data.filter(r => r.status === 'APPROVED'), projectName)

  const handleCancel = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการลงทะเบียนนี้? ระบบจะเลื่อนคิวสำรองขึ้นมาแทนที่โดยอัตโนมัติหากมีผู้รอคิว")) return
    
    setLoading(true)
    const res = await cancelRegistration(id)
    if ('success' in res && res.success) {
      alert("ยกเลิกการลงทะเบียนสำเร็จ")
      setData(data.map(r => r.id === id ? { ...r, status: 'CANCELLED' } : r))
    } else if ('error' in res) {
      alert(res.error)
    }
    setLoading(false)
  }

  const handleApproveAllWaitlist = async () => {
    if (!confirm("การดำเนินการนี้จะข้ามเงื่อนไขจำนวนที่นั่งและอนุมัตินักเรียนในรายชื่อสำรองทั้งหมด คุณแน่ใจหรือไม่?")) return
    
    setLoading(true)
    const res = await approveAllWaitlist(projectId)
    if ('success' in res && res.success) {
      alert(`อนุมัติรายชื่อสำรองจำนวน ${res.count} คนสำเร็จ!`)
      setData(data.map(r => r.status === 'WAITLISTED' ? { ...r, status: 'APPROVED' } : r))
    } else if ('error' in res) {
      alert(res.error)
    }
    setLoading(false)
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">ศูนย์ควบคุม - {projectName}</h1>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExportExcel} disabled={loading} className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50">
            ส่งออก .xlsx (ตัวจริง)
          </button>
          <button onClick={handleExportPDF} disabled={loading} className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50">
            ส่งออก .pdf (ตัวจริง)
          </button>
          <button onClick={handleApproveAllWaitlist} disabled={loading} className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50">
            อนุมัติตัวสำรองทั้งหมด
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[400px]">
          <h2 className="text-lg font-semibold mb-6 text-gray-700">สัดส่วนที่นั่งและตัวสำรอง</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quotaStats} margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} dy={10} tickFormatter={(val) => `ม.${val}`} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
              <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Legend wrapperStyle={{paddingTop: '20px'}} />
              <Bar dataKey="approved" stackId="a" fill="#10B981" name="ตัวจริง (Approved)" radius={[0, 0, 4, 4]} maxBarSize={50} />
              <Bar dataKey="waitlisted" stackId="a" fill="#F59E0B" name="ตัวสำรอง (Waitlisted)" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-700">ข้อมูลการลงทะเบียน</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-sm font-medium">
                <th className="p-4 border-b border-gray-100">รหัสนักเรียน</th>
                <th className="p-4 border-b border-gray-100">ชื่อ-นามสกุล</th>
                <th className="p-4 border-b border-gray-100">ชั้น/ห้อง (เลขที่)</th>
                <th className="p-4 border-b border-gray-100">สถานะ</th>
                <th className="p-4 border-b border-gray-100 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {data.map(reg => (
                <tr key={reg.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                  <td className="p-4 font-medium">{reg.studentIdInput}</td>
                  <td className="p-4">{reg.prefix}{reg.firstName} {reg.lastName}</td>
                  <td className="p-4">ม.{reg.grade}/{reg.room} #{reg.number}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                      ${reg.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : ''}
                      ${reg.status === 'WAITLISTED' ? 'bg-amber-100 text-amber-800' : ''}
                      ${reg.status === 'CANCELLED' ? 'bg-slate-100 text-slate-700' : ''}
                      ${reg.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : ''}
                    `}>
                      {reg.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {reg.status === 'APPROVED' && (
                      <button 
                        onClick={() => handleCancel(reg.id)}
                        disabled={loading}
                        className="text-rose-600 hover:text-rose-800 font-medium disabled:opacity-50 transition-colors"
                      >
                        ยกเลิกสิทธิ์
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">ไม่พบข้อมูลการลงทะเบียน</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
