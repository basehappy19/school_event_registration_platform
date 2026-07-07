"use client"

import { useMemo, useState, useEffect } from "react"
import { Users, CheckCircle2, Clock, Calendar as CalendarIcon, TrendingUp, BarChart3, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts"
import { ProjectWithRelations } from "@/app/types"

export default function AdminProjectStats({ project }: { project: ProjectWithRelations }) {
  const { quotas = [], registrations = [] } = project
  const [timeFilter, setTimeFilter] = useState<'second' | 'minute' | 'hour' | 'day'>('minute')
  const [isStatusStatsOpen, setIsStatusStatsOpen] = useState(true)
  const [isTimeStatsOpen, setIsTimeStatsOpen] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsStatusStatsOpen(false)
      setIsTimeStatsOpen(false)
    }
  }, [])

  const stats = useMemo(() => {
    let totalQuota = 0
    const quotaByGrade: Record<string, number> = {}
    quotas.forEach((q) => {
      totalQuota += q.capacity
      quotaByGrade[q.grade] = q.capacity
    })

    const regByGrade: Record<string, number> = {}
    const approvedByGrade: Record<string, number> = {}
    const waitlistedByGrade: Record<string, number> = {}
    const rejectedByGrade: Record<string, number> = {}
    let totalApproved = 0
    let totalWaitlisted = 0
    let totalRejected = 0
    
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
        waitlistedByGrade[grade] = (waitlistedByGrade[grade] || 0) + 1
        totalWaitlisted++
      } else {
        rejectedByGrade[grade] = (rejectedByGrade[grade] || 0) + 1
        totalRejected++
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
        const s = pad(dateObj.getSeconds())

        let dateStr = ''
        if (timeFilter === 'second') {
          dateStr = `${Y}-${M}-${D} ${h}:${m}:${s}`
        } else if (timeFilter === 'minute') {
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

    // Prepare Cumulative Time Series Array
    const allSeriesGrades = new Set<string>()
    Object.values(timeSeriesMap).forEach(gradeMap => {
      Object.keys(gradeMap).forEach(g => allSeriesGrades.add(g))
    })

    const runningTotals: Record<string, number> = {}
    const timeSeriesData = Object.keys(timeSeriesMap).sort().map(date => {
      const obj: Record<string, string | number> = { date }
      Object.keys(timeSeriesMap[date]).forEach(grade => {
        runningTotals[grade] = (runningTotals[grade] || 0) + timeSeriesMap[date][grade]
      })
      allSeriesGrades.forEach(grade => {
        obj[`ม.${grade}`] = runningTotals[grade] || 0
      })
      return obj
    })

    // Prepare Grade Breakdown Array
    const grades = Array.from(new Set([...Object.keys(quotaByGrade), ...Object.keys(regByGrade)])).sort((a, b) => Number(a) - Number(b))
    const gradeBreakdown = grades.map(g => ({
      grade: `ม.${g}`,
      quota: quotaByGrade[g] || 0,
      registered: regByGrade[g] || 0,
      approved: approvedByGrade[g] || 0,
      waitlisted: waitlistedByGrade[g] || 0,
      rejected: rejectedByGrade[g] || 0,
    }))

    // Prepare Status Pie Chart Array
    const statusData = [
      { name: 'ตัวจริง', value: totalApproved, color: '#10b981' },
      { name: 'สำรอง', value: totalWaitlisted, color: '#f59e0b' },
      { name: 'ไม่ได้รับสิทธิ์', value: totalRejected, color: '#f43f5e' },
    ].filter(d => d.value > 0)

    return {
      totalQuota,
      totalRegistered: registrations.length,
      totalApproved,
      totalWaitlisted,
      totalRejected,
      gradeBreakdown,
      timeSeriesData,
      statusData,
      grades
    }
  }, [quotas, registrations, timeFilter])

  const lineColors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444']

  return (
    <div className="space-y-6 mb-6">
      {/* Top Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 leading-tight">ยอดลงทะเบียนทั้งหมด</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.totalRegistered}</span>
              <span className="text-sm font-medium text-slate-500">/ {stats.totalQuota || '?'} คน</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
          <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100/80 min-w-[110px]">
            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold mb-1">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>ตัวจริง</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-bold text-emerald-950">{stats.totalApproved}</span>
              <span className="text-xs text-emerald-700/80">คน</span>
            </div>
          </div>

          <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-100/80 min-w-[110px]">
            <div className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold mb-1">
              <Clock className="w-4 h-4 shrink-0" />
              <span>สำรอง</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-bold text-amber-950">{stats.totalWaitlisted}</span>
              <span className="text-xs text-amber-700/80">คน</span>
            </div>
          </div>

          <div className="bg-rose-50/60 rounded-xl p-3 border border-rose-100/80 min-w-[110px]">
            <div className="flex items-center gap-1.5 text-rose-700 text-xs font-semibold mb-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">ไม่ได้รับสิทธิ์</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-bold text-rose-950">{stats.totalRejected}</span>
              <span className="text-xs text-rose-700/80">คน</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: สัดส่วนสถานะนักเรียน */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm transition-all">
        <div 
          onClick={() => setIsStatusStatsOpen(!isStatusStatsOpen)}
          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 cursor-pointer select-none ${isStatusStatsOpen ? 'mb-6 pb-4 border-b border-slate-100' : ''}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">สัดส่วนสถานะนักเรียน</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">เปรียบเทียบสัดส่วนและจำนวนนักเรียนสถานะ ตัวจริง, สำรอง, ไม่ได้รับสิทธิ์ ทั้งแบบรวมและแยกรายละเอียดแต่ละระดับชั้น (ม.)</p>
            </div>
          </div>
          <button 
            type="button"
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-all self-end sm:self-auto"
            title={isStatusStatsOpen ? "ย่อเก็บ" : "ขยายดูข้อมูล"}
          >
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isStatusStatsOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isStatusStatsOpen && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in-50 slide-in-from-top-3 duration-300 ease-out">
            {/* Left Column (1/3): รวมทั้งหมด (Total Donut) */}
            <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-sm">ภาพรวมทั้งหมด</span>
                </div>
                <div className="h-60 w-full relative my-2">
                  {stats.statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                          isAnimationActive={false}
                        >
                          {stats.statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          position={{ x: 0, y: 0 }}
                          allowEscapeViewBox={{ x: true, y: true }}
                          wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                          contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                          formatter={(val: any) => [`${val} คน`, 'จำนวน']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                      <p>ยังไม่มีข้อมูลสถานะ</p>
                    </div>
                  )}
                  {stats.statusData.length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-3xl font-black text-slate-900 leading-none">{stats.totalRegistered}</p>
                        <p className="text-xs font-bold text-slate-500 mt-1">รวมทั้งหมด</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Legend */}
              {stats.statusData.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-2">
                  {stats.statusData.map((entry, index) => {
                    const percentage = stats.totalRegistered > 0 ? ((entry.value / stats.totalRegistered) * 100).toFixed(1) : '0'
                    return (
                      <div key={index} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                          <span className="text-slate-700 font-bold">{entry.name}</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-slate-900 font-black text-sm">{entry.value}</span>
                          <span className="text-slate-500 font-medium">คน ({percentage}%)</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right Column (2/3): แยกตามระดับชั้น (Stacked Bar Chart & Cards) */}
            <div className="lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">เปรียบเทียบสถานะแต่ละระดับชั้น (ม.)</h4>
                  </div>
                </div>

                <div className="h-64 w-full">
                  {stats.gradeBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.gradeBreakdown} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="grade" tick={{ fontSize: 13, fontWeight: 700, fill: '#334155' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                        <RechartsTooltip 
                          allowEscapeViewBox={{ x: true, y: true }}
                          wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '13px', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                          formatter={(val: any, name: any) => {
                            const labelMap: Record<string, string> = {
                              approved: 'ตัวจริง',
                              waitlisted: 'สำรอง',
                              rejected: 'ไม่ได้รับสิทธิ์'
                            }
                            return [`${val} คน`, labelMap[String(name)] || name]
                          }}
                          labelFormatter={(label) => `ระดับชั้น ${label}`}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                          formatter={(value) => {
                            const labelMap: Record<string, string> = {
                              approved: 'ตัวจริง',
                              waitlisted: 'สำรอง',
                              rejected: 'ไม่ได้รับสิทธิ์'
                            }
                            return <span className="text-xs font-bold text-slate-700 ml-1">{labelMap[value] || value}</span>
                          }}
                        />
                        <Bar dataKey="approved" name="approved" fill="#10b981" radius={[3, 3, 0, 0]} stackId="a" isAnimationActive={false} />
                        <Bar dataKey="waitlisted" name="waitlisted" fill="#f59e0b" radius={[3, 3, 0, 0]} stackId="a" isAnimationActive={false} />
                        <Bar dataKey="rejected" name="rejected" fill="#f43f5e" radius={[3, 3, 0, 0]} stackId="a" isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                      <p>ยังไม่มีข้อมูลระดับชั้น</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Individual Grade Cards below chart */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100">
                {stats.gradeBreakdown.map((gb, idx) => (
                  <div key={idx} className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 hover:border-indigo-300 transition-all">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 gap-2">
                      <span className="font-extrabold text-slate-900 text-lg shrink-0">{gb.grade}</span>
                      <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                        รวม <span className="text-slate-900 font-black text-sm">{gb.registered}</span>{gb.quota ? ` / ${gb.quota}` : ''} คน
                      </span>
                    </div>
                    <div className="space-y-2 text-xs font-medium text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                          <span>ตัวจริง</span>
                        </span>
                        <span className="font-extrabold text-slate-900 text-sm">{gb.approved} <span className="text-xs font-normal text-slate-400">คน</span></span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                          <span>สำรอง</span>
                        </span>
                        <span className="font-extrabold text-slate-900 text-sm">{gb.waitlisted} <span className="text-xs font-normal text-slate-400">คน</span></span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                          <span>ไม่ได้รับสิทธิ์</span>
                        </span>
                        <span className="font-extrabold text-slate-900 text-sm">{gb.rejected} <span className="text-xs font-normal text-slate-400">คน</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Row 3: ยอดสะสมการลงทะเบียนตามเวลา (Line Chart) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm transition-all">
        <div 
          onClick={() => setIsTimeStatsOpen(!isTimeStatsOpen)}
          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer select-none ${isTimeStatsOpen ? 'mb-6 pb-4 border-b border-slate-100' : ''}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">ยอดสะสมการลงทะเบียนตามเวลา</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">กราฟแสดงแนวโน้มยอดผู้ลงทะเบียนสะสมแยกตามระดับชั้นและช่วงเวลา</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
            {isTimeStatsOpen && (
              <select 
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as 'second' | 'minute' | 'hour' | 'day')}
                className="text-sm border border-slate-200 rounded-lg text-slate-600 bg-white focus:ring-indigo-500 focus:border-indigo-500 py-1.5 pl-3 pr-8 shadow-sm"
              >
                <option value="second">รายวินาที</option>
                <option value="minute">รายนาที</option>
                <option value="hour">รายชั่วโมง</option>
                <option value="day">รายวัน</option>
              </select>
            )}
            <button 
              type="button"
              onClick={() => setIsTimeStatsOpen(!isTimeStatsOpen)}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-all"
              title={isTimeStatsOpen ? "ย่อเก็บ" : "ขยายดูข้อมูล"}
            >
              <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isTimeStatsOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
        {isTimeStatsOpen && (
        <div className="h-72 w-full animate-in fade-in-50 slide-in-from-top-3 duration-300 ease-out">
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
                  allowEscapeViewBox={{ x: true, y: true }}
                  wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
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
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <CalendarIcon className="w-10 h-10 mb-2 opacity-50" />
              <p>ยังไม่มีข้อมูลการลงทะเบียน</p>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  )
}
