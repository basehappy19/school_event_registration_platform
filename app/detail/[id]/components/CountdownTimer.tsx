"use client"
import { useState, useEffect } from "react"
import { Timer } from "lucide-react"

export default function CountdownTimer({ startDate, endDate }: { startDate?: string | Date | null, endDate?: string | Date | null }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [status, setStatus] = useState<"WAITING" | "OPEN" | "CLOSED">("WAITING")
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!startDate) {
      setStatus("OPEN")
      return
    }

    const start = new Date(startDate).getTime()
    const end = endDate ? new Date(endDate).getTime() : null

    const interval = setInterval(() => {
      const now = new Date().getTime()

      let target = 0
      if (now < start) {
        setStatus("WAITING")
        target = start
      } else if (end && now > end) {
        setStatus("CLOSED")
        clearInterval(interval)
        return
      } else if (!end && now >= start) {
        setStatus("OPEN")
        clearInterval(interval)
        return
      } else if (end && now >= start && now <= end) {
        setStatus("OPEN")
        target = end
      }

      if (target > 0) {
        const distance = target - now
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [startDate, endDate])

  if (!isMounted || status === "CLOSED" || (!endDate && status === "OPEN") || !startDate) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center text-indigo-700">
          <Timer className="w-5 h-5 mr-2 text-indigo-600" />
          <span className="font-semibold text-sm">
            {status === "WAITING" ? "เปิดลงทะเบียนอีก:" : "เหลือเวลาลงทะเบียนอีก:"}
          </span>
        </div>
        <div className="flex gap-2 sm:gap-3 text-center">
          <div className="bg-white border border-indigo-100 rounded-xl px-3 sm:px-4 py-2 min-w-15 sm:min-w-17.5 shadow-sm">
            <div className="text-2xl font-bold text-indigo-700 leading-none mb-1">{timeLeft.days}</div>
            <div className="text-[10px] sm:text-xs text-indigo-500 font-medium">วัน</div>
          </div>
          <div className="bg-white border border-indigo-100 rounded-xl px-3 sm:px-4 py-2 min-w-15 sm:min-w-17.5 shadow-sm">
            <div className="text-2xl font-bold text-indigo-700 leading-none mb-1">{timeLeft.hours}</div>
            <div className="text-[10px] sm:text-xs text-indigo-500 font-medium">ชั่วโมง</div>
          </div>
          <div className="bg-white border border-indigo-100 rounded-xl px-3 sm:px-4 py-2 min-w-15 sm:min-w-17.5 shadow-sm">
            <div className="text-2xl font-bold text-indigo-700 leading-none mb-1">{timeLeft.minutes}</div>
            <div className="text-[10px] sm:text-xs text-indigo-500 font-medium">นาที</div>
          </div>
          <div className="bg-white border border-indigo-100 rounded-xl px-3 sm:px-4 py-2 min-w-15 sm:min-w-17.5 shadow-sm">
            <div className="text-2xl font-bold text-indigo-700 leading-none mb-1">{timeLeft.seconds}</div>
            <div className="text-[10px] sm:text-xs text-indigo-500 font-medium">วินาที</div>
          </div>
        </div>
      </div>
      <div className="text-center text-sm text-slate-600 leading-relaxed">
        <span className="block sm:inline">
          เปิดลงทะเบียน {new Date(startDate).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} เวลา {new Date(startDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
        </span>
        {endDate && (
          <>
            <span className="hidden sm:inline"> - </span>
            <span className="block sm:inline">
              <span className="sm:hidden text-slate-400">ถึง </span>
              {new Date(endDate).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} เวลา {new Date(endDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
            </span>
          </>
        )}
      </div>
    </div>
  )
}
