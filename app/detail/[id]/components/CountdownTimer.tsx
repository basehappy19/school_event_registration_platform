"use client"
import { useState, useEffect } from "react"
import { Timer } from "lucide-react"

export default function CountdownTimer({ startDate, endDate }: { startDate: string | Date, endDate: string | Date }) {
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
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()

    const interval = setInterval(() => {
      const now = new Date().getTime()

      let target = 0
      if (now < start) {
        setStatus("WAITING")
        target = start
      } else if (now >= start && now <= end) {
        setStatus("OPEN")
        target = end
      } else {
        setStatus("CLOSED")
        clearInterval(interval)
        return
      }

      const distance = target - now
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [startDate, endDate])

  if (!isMounted || status === "CLOSED") return null

  return (
    <div className="bg-indigo-900/20 border border-indigo-400/30 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
      <div className="flex items-center text-indigo-100">
        <Timer className="w-5 h-5 mr-2 text-indigo-200" />
        <span className="font-semibold text-sm">
          {status === "WAITING" ? "จะเปิดรับสมัครในอีก:" : "เหลือเวลาลงทะเบียนอีก:"}
        </span>
      </div>
      <div className="flex gap-2 sm:gap-3 text-center">
        <div className="bg-white/10 rounded-xl px-3 sm:px-4 py-2 min-w-[60px] sm:min-w-[70px] shadow-sm">
          <div className="text-2xl font-bold text-white leading-none mb-1">{timeLeft.days}</div>
          <div className="text-[10px] sm:text-xs text-indigo-200 font-medium">วัน</div>
        </div>
        <div className="bg-white/10 rounded-xl px-3 sm:px-4 py-2 min-w-[60px] sm:min-w-[70px] shadow-sm">
          <div className="text-2xl font-bold text-white leading-none mb-1">{timeLeft.hours}</div>
          <div className="text-[10px] sm:text-xs text-indigo-200 font-medium">ชั่วโมง</div>
        </div>
        <div className="bg-white/10 rounded-xl px-3 sm:px-4 py-2 min-w-[60px] sm:min-w-[70px] shadow-sm">
          <div className="text-2xl font-bold text-white leading-none mb-1">{timeLeft.minutes}</div>
          <div className="text-[10px] sm:text-xs text-indigo-200 font-medium">นาที</div>
        </div>
        <div className="bg-white/10 rounded-xl px-3 sm:px-4 py-2 min-w-[60px] sm:min-w-[70px] shadow-sm">
          <div className="text-2xl font-bold text-white leading-none mb-1">{timeLeft.seconds}</div>
          <div className="text-[10px] sm:text-xs text-indigo-200 font-medium">วินาที</div>
        </div>
      </div>
    </div>
  )
}
