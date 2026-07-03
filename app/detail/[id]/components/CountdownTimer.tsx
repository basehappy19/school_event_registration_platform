"use client"
import { useState, useEffect } from "react"
import { Timer, Sparkles } from "lucide-react"

const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsChanging(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsChanging(false);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  return (
    <span 
      className={`inline-block tabular-nums transition-all duration-200 transform ${
        isChanging 
          ? 'opacity-0 scale-75 -translate-y-2 filter blur-[1px]' 
          : 'opacity-100 scale-100 translate-y-0 filter blur-0'
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
        return true
      } else if (!end && now >= start) {
        setStatus("OPEN")
        return true
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

    const shouldStop = calculateTime()
    if (shouldStop) return

    const interval = setInterval(() => {
      const stop = calculateTime()
      if (stop) clearInterval(interval)
    }, 1000)

    return () => clearInterval(interval)
  }, [startDate, endDate])

  if (!isMounted || status === "CLOSED" || (!endDate && status === "OPEN") || !startDate) return null

  const TimeBox = ({ value, label, isHighlight }: { value: number, label: string, isHighlight?: boolean }) => {
    const [pulse, setPulse] = useState(false);
    useEffect(() => {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 250);
      return () => clearTimeout(timer);
    }, [value]);

    return (
      <div className={`relative group rounded-2xl p-[1.5px] transition-all duration-300 ${
        isHighlight 
          ? 'bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-indigo-500/25 scale-[1.03]' 
          : 'bg-gradient-to-b from-indigo-200 via-indigo-100 to-slate-200 hover:border-indigo-300 shadow-xs'
      }`}>
        <div className={`rounded-[14px] px-2.5 sm:px-4 py-2.5 sm:py-3.5 min-w-[62px] sm:min-w-[78px] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${
          isHighlight ? 'bg-slate-900 text-white' : 'bg-white text-indigo-950'
        }`}>
          <div className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
            pulse ? 'opacity-40 bg-gradient-to-t from-indigo-500/40 via-purple-500/20 to-transparent' : 'opacity-0'
          }`} />

          <div className={`text-2xl sm:text-3xl font-black leading-none mb-1 relative z-10 tracking-tight transition-transform duration-300 ${
            pulse ? 'scale-110' : 'scale-100'
          } ${isHighlight ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-pink-200' : 'text-indigo-600'}`}>
            <AnimatedNumber value={value} />
          </div>
          <div className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider relative z-10 ${
            isHighlight ? 'text-indigo-300 font-extrabold' : 'text-slate-500'
          }`}>
            {label}
          </div>
        </div>
      </div>
    )
  }

  const Separator = () => (
    <div className="flex flex-col justify-center items-center pb-5 px-0.5 animate-pulse">
      <span className="text-xl sm:text-2xl font-black text-indigo-400/80">:</span>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-pink-50/50 backdrop-blur-md border border-indigo-200/60 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-lg shadow-indigo-500/5">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60"></div>
        <div className="flex flex-col items-center sm:items-start text-indigo-950 z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Timer className="w-4 h-4 animate-spin-slow" />
            </div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-indigo-900 via-indigo-700 to-purple-800 bg-clip-text text-transparent">
              {status === "WAITING" ? "เตรียมพร้อมเปิดลงทะเบียนในอีก" : "เหลือเวลาลงทะเบียน"}
            </span>
            <Sparkles className="w-4 h-4 text-amber-500 animate-bounce" />
          </div>
          <span className="text-xs sm:text-sm text-indigo-600/80 font-semibold pl-10 hidden sm:block">
            นับถอยหลังสู่ช่วงเวลากิจกรรมสำคัญ
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 text-center z-10">
          <TimeBox value={timeLeft.days} label="วัน" />
          <Separator />
          <TimeBox value={timeLeft.hours} label="ชั่วโมง" />
          <Separator />
          <TimeBox value={timeLeft.minutes} label="นาที" />
          <Separator />
          <TimeBox value={timeLeft.seconds} label="วินาที" isHighlight />
        </div>
      </div>
      <div className="text-center text-xs sm:text-sm text-slate-500 font-medium">
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
