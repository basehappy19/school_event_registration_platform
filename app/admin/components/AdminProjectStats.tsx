"use client"

import { useMemo, useState } from "react"
import { Users, CheckCircle2, Clock, Calendar as CalendarIcon, TrendingUp, BarChart3 } from "lucide-react"
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from "recharts"
import { ProjectWithRelations } from "@/app/types"

export default function AdminProjectStats({ project }: { project: ProjectWithRelations }) {
  const { quotas = [], registrations = [] } = project
  const [timeFilter, setTimeFilter] = useState<'minute' | 'hour' | 'day'>('hour')

  const stats = useMemo(() => {
    let totalQuota = 0
    const quotaByGrade: Record<string, number> = {}
    quotas.forEach((q) => {
      totalQuota += q.capacity
      quotaByGrade[q.grade] = q.capacity
    })

    const regByGrade: Record<string, number> = {}
    const approvedByGrade: Record<string, number> = {}
    let totalApproved = 0
    let totalWaitlisted = 0
    
    // For Line Chart (Time Series)
    const timeSeriesMap: Record<string, Record<string, number>> = {}
    
    // For Status Breakdown
    const statusCounts: Record<string, number> = {
      'APPROVED': 0,
      'WAITLISTED': 0,
      'REJECTED': 0,
      'CANCELLED': 0
    }

    registrations.forEach((r) => {
      const grade = r.studentProfile.grade
      regByGrade[grade] = (regByGrade[grade] || 0) + 1
      
      if (r.status === 'APPROVED') {
        approvedByGrade[grade] = (approvedByGrade[grade] || 0) + 1
        totalApproved++
      } else if (r.status === 'WAITLISTED') {
        totalWaitlisted++
      }
      
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1

      // Time series grouping
      if (r.createdAt) {
        const dateObj = new Date(r.createdAt)
        const pad = (n: number) => n.toString().padStart(2, '0')
        const Y = dateObj.getFullYear()
        const M = pad(dateObj.getMonth() + 1)
        const D = pad(dateObj.getDate())
        const h = pad(dateObj.getHours())
        const m = pad(dateObj.getMinutes())

        let dateStr = ''
        if (timeFilter === 'minute') {
          dateStr = `${Y}-${M}-${D} ${h}:${m}`
        } else if (timeFilter === 'hour') {
          dateStr = `${Y}-${M}-${D} ${h}:00`
        } else {
          dateStr = `${Y}-${M}-${D}`
        }

        if (!timeSeriesMap[dateStr]) {
          timeSeriesMap[dateStr] = {}
        }
        timeSeriesMap[dateStr][grade] = (timeSeriesMap[dateStr][grade] || 0) + 1
      }
    })

    // Prepare Time Series Array
    const timeSeriesData = Object.keys(timeSeriesMap).sort().map(date => {
      const obj: Record<string, string | number> = { date }
      Object.keys(timeSeriesMap[date]).forEach(grade => {
        obj[`ม.${grade}`] = timeSeriesMap[date][grade]
      })
      return obj
    })

    // Prepare Grade Breakdown Array
    const grades = Array.from(new Set([...Object.keys(quotaByGrade), ...Object.keys(regByGrade)])).sort((a, b) => Number(a) - Number(b))
    const gradeBreakdown = grades.map(g => ({
      grade: `ม.${g}`,
      quota: quotaByGrade[g] || 0,
      registered: regByGrade[g] || 0,
      approved: approvedByGrade[g] || 0
    }))

    // Prepare Status Pie Chart Array
    const statusData = [
      { name: 'ตัวจริง', value: statusCounts['APPROVED'] || 0, color: '#10b981' },
      { name: 'สำรอง', value: statusCounts['WAITLISTED'] || 0, color: '#f59e0b' },
    ].filter(d => d.value > 0)

    return {
      totalQuota,
      totalRegistered: registrations.length,
      totalApproved,
      totalWaitlisted,
      gradeBreakdown,
      timeSeriesData,
      statusData,
      grades
    }
  }, [quotas, registrations, timeFilter])

  const lineColors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444']

  return (
    <div className="space-y-6 mb-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-start gap-4 h-full">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex flex-col justify-between h-full w-full min-h-12">
            <p className="text-sm font-medium text-slate-500 mb-1 leading-tight">ยอดรับสมัครทั้งหมด</p>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-2xl font-bold text-slate-900">{stats.totalRegistered}</span>
              <span className="text-sm text-slate-500 font-medium">/ {stats.totalQuota || '?'} คน</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-start gap-4 h-full">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex flex-col justify-between h-full w-full min-h-12">
            <p className="text-sm font-medium text-slate-500 mb-1 leading-tight">ตัวจริง</p>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-2xl font-bold text-slate-900">{stats.totalApproved}</span>
              <span className="text-sm text-slate-500 font-medium">คน</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-start gap-4 h-full">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex flex-col justify-between h-full w-full min-h-12">
            <p className="text-sm font-medium text-slate-500 mb-1 leading-tight">สำรอง</p>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-2xl font-bold text-slate-900">{stats.totalWaitlisted}</span>
              <span className="text-sm text-slate-500 font-medium">คน</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BarChart3 className="w-16 h-16" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500 mb-3">สรุปตามระดับชั้น</p>
            <div className="space-y-1.5 max-h-20 overflow-y-auto pr-2 custom-scrollbar">
              {stats.gradeBreakdown.length > 0 ? stats.gradeBreakdown.map((gb, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{gb.grade}</span>
                  <span className="text-slate-500"><strong className="text-slate-900">{gb.registered}</strong> / {gb.quota || '?'}</span>
                </div>
              )) : (
                <p className="text-sm text-slate-400">ยังไม่มีข้อมูล</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800">แนวโน้มการสมัครตามเวลา</h3>
            </div>
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as 'minute' | 'hour' | 'day')}
              className="text-sm border border-slate-200 rounded-lg text-slate-600 bg-white focus:ring-indigo-500 focus:border-indigo-500 py-1.5 pl-3 pr-8 shadow-sm"
            >
              <option value="minute">รายนาที</option>
              <option value="hour">รายชั่วโมง</option>
              <option value="day">รายวัน</option>
            </select>
          </div>
          <div className="h-72 w-full">
            {stats.timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.timeSeriesData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    tickFormatter={(val) => {
                      const parts = val.split(' ')
                      const dParts = parts[0].split('-')
                      if (dParts.length !== 3) return val
                      const label = `${parseInt(dParts[2])}/${parseInt(dParts[1])}`
                      if (parts.length === 2) {
                        return `${label} ${parts[1]}`
                      }
                      return label
                    }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(label) => {
                      if (!label) return ''
                      const parts = label.toString().split(' ')
                      const dParts = parts[0].split('-')
                      if (dParts.length !== 3) return label
                      const dateStr = `${dParts[2]}/${dParts[1]}/${parseInt(dParts[0]) + 543}`
                      if (parts.length === 2) {
                        return `${dateStr} เวลา ${parts[1]} น.`
                      }
                      return dateStr
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  {stats.grades.map((grade, idx) => (
                    <Line 
                      key={grade}
                      type="monotone" 
                      dataKey={`ม.${grade}`} 
                      stroke={lineColors[idx % lineColors.length]} 
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 2 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <CalendarIcon className="w-10 h-10 mb-2 opacity-50" />
                <p>ยังไม่มีข้อมูลการสมัคร</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800">สัดส่วนสถานะนักเรียน</h3>
          </div>
          <div className="h-64 w-full relative">
            {stats.statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <p>ยังไม่มีข้อมูลสถานะ</p>
              </div>
            )}
            {stats.statusData.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center -mt-5">
                  <p className="text-3xl font-bold text-slate-800">{stats.totalRegistered}</p>
                  <p className="text-xs text-slate-500">รวมทั้งหมด</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
