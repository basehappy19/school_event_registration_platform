"use client"
import { useState, useEffect } from "react"
import { Timer } from "lucide-react"

const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [direction, setDirection] = useState<'up' | 'down' | 'none'>('none');

  useEffect(() => {
    if (value !== displayValue) {
      setDirection('up');
      const timeout1 = setTimeout(() => {
        setDisplayValue(value);
        setDirection('down');
        
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setDirection('none');
          });
        });
      }, 150);
      return () => clearTimeout(timeout1);
    }
  }, [value, displayValue]);

  return (
    <span 
      className={`inline-block tabular-nums transition-all ${
        direction === 'up' ? 'opacity-0 -translate-y-4 duration-150 ease-in' : 
        direction === 'down' ? 'opacity-0 translate-y-4 duration-0' : 
        'opacity-100 translate-y-0 duration-150 ease-out'
      }`}
    >
      {displayValue.toString().padStart(2, '0')}
    </span>
  );
};

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

    const calculateTime = () => {
      const now = new Date().getTime()

      let target = 0
      if (now < start) {
        setStatus("WAITING")
        target = start
      } else if (end && now > end) {
        setStatus("CLOSED")
        return true // stop interval
      } else if (!end && now >= start) {
        setStatus("OPEN")
        return true // stop interval
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
      return false
    }

    // Initial calculation immediately
    const shouldStop = calculateTime()
    if (shouldStop) return

    const interval = setInterval(() => {
      const stop = calculateTime()
      if (stop) clearInterval(interval)
    }, 1000)

    return () => clearInterval(interval)
  }, [startDate, endDate])

  if (!isMounted || status === "CLOSED" || (!endDate && status === "OPEN") || !startDate) return null

  const TimeBox = ({ value, label }: { value: number, label: string }) => (
    <div className="bg-white border border-indigo-100 rounded-2xl px-2 sm:px-4 py-2 sm:py-3 min-w-[64px] sm:min-w-[76px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(99,102,241,0.1)] transition-shadow duration-300 flex flex-col items-center justify-center relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="text-2xl sm:text-3xl font-black text-indigo-600 leading-none mb-1 relative z-10">
        <AnimatedNumber value={value} />
      </div>
      <div className="text-[10px] text-indigo-500/80 font-bold uppercase tracking-widest relative z-10">{label}</div>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 backdrop-blur-sm border border-indigo-100/60 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20"></div>
        <div className="flex flex-col items-center sm:items-start text-indigo-900 z-10">
          <div className="flex items-center mb-1.5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3 text-indigo-600">
              <Timer className="w-4 h-4" />
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight">
              {status === "WAITING" ? "เปิดลงทะเบียนในอีก" : "เหลือเวลาลงทะเบียน"}
            </span>
          </div>
          <span className="text-sm text-indigo-500/80 font-medium pl-11 hidden sm:block">
            เตรียมตัวให้พร้อมสำหรับกิจกรรม
          </span>
        </div>
        <div className="flex gap-2 sm:gap-3 text-center z-10">
          <TimeBox value={timeLeft.days} label="วัน" />
          <TimeBox value={timeLeft.hours} label="ชั่วโมง" />
          <TimeBox value={timeLeft.minutes} label="นาที" />
          <TimeBox value={timeLeft.seconds} label="วินาที" />
        </div>
      </div>
      <div className="text-center text-sm text-slate-500 font-medium">
        <span className="block sm:inline">
          เปิดลงทะเบียน {new Date(startDate).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Bangkok' })} เวลา {new Date(startDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' })} น.
        </span>
        {endDate && (
          <>
            <span className="hidden sm:inline mx-2 text-slate-300">•</span>
            <span className="block sm:inline">
              <span className="sm:hidden text-slate-400">ถึง </span>
              {new Date(endDate).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Bangkok' })} เวลา {new Date(endDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' })} น.
            </span>
          </>
        )}
      </div>
    </div>
  )
}
