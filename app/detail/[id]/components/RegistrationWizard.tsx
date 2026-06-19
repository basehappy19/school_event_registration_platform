"use client"

import { useState, useEffect } from "react"
import { submitRegistration } from "@/app/actions/registration"
import { useRouter } from "next/navigation"
import { ArrowLeft, UserCheck, ShieldCheck, Loader2, MapPin, Calendar, Clock, Users } from "lucide-react"
import { signInWithGoogle, signOutAction, signOutAndRedirect } from "@/app/actions/auth"
import Link from "next/link"
import CountdownTimer from "./CountdownTimer"
import { formatThaiDateWithDay } from "@/lib/dateUtils"
import { ProjectForWizard } from "@/app/types"
import { StudentProfile } from "@prisma/client"
import { Session } from "next-auth"

export default function RegistrationWizard({ project, session, profile, errorParam }: { project: ProjectForWizard, session: Session | null, profile: StudentProfile | null, errorParam?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(errorParam === "AccessDenied")

  const closeAccessDeniedModal = () => {
    setShowAccessDeniedModal(false)
    router.replace(`/detail/${project.id}`)
  }

  // Real-time Stats State
  const [stats, setStats] = useState({ totalCapacity: 0, totalRegistered: 0, viewersCount: 1 })
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15))

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/projects/${project.id}/stats?sessionId=${sessionId}`)
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (e) {
        // ignore
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 2000)

    const handleBeforeUnload = () => {
      navigator.sendBeacon(`/api/projects/${project.id}/stats?sessionId=${sessionId}&action=leave`)
    }
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      navigator.sendBeacon(`/api/projects/${project.id}/stats?sessionId=${sessionId}&action=leave`)
    }
  }, [project.id, sessionId])


  // Custom Answers State
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const allowedGrades = project.quotas.map((q) => q.grade)
  const isGradeAllowed = profile ? allowedGrades.includes(profile.grade) : false

  const now = new Date()
  const regStart = project.registrationStartDate ? new Date(project.registrationStartDate) : null
  const regEnd = project.registrationEndDate ? new Date(project.registrationEndDate) : null

  let isTimeOpen = true
  let isBeforeStart = false
  if (regStart && now < regStart) {
    isTimeOpen = false
    isBeforeStart = true
  }
  if (regEnd && now > regEnd) {
    isTimeOpen = false
  }

  const isRegistrationOpen = project.isRegistrationOpen && isTimeOpen

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !profile || !isGradeAllowed || !isRegistrationOpen) return

    setLoading(true)
    setError("")

    const formAnswers = Object.entries(answers).map(([fieldId, value]) => ({
      fieldId: parseInt(fieldId, 10),
      value
    }))

    const payload = {
      projectId: project.id,
      formAnswers
    }

    const res = await submitRegistration(payload)
    if ('error' in res) {
      setError(res.error || "An error occurred")
      setLoading(false)
    } else {
      router.push(`/detail/${project.id}/success?status=${res.status}`)
    }
  }

  return (
    <div className="bg-white sm:rounded-3xl sm:shadow-xl sm:border border-slate-100 overflow-hidden relative animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Access Denied Modal */}
      {showAccessDeniedModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">สิทธิ์การเข้าถึงถูกปฏิเสธ</h3>
            <p className="text-slate-600 mb-6 text-sm">กรุณาใช้อีเมลของโรงเรียน (@phukhieo.ac.th) ในการเข้าสู่ระบบเพื่อลงทะเบียนกิจกรรมเท่านั้น</p>
            <button
              onClick={closeAccessDeniedModal}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl transition-all"
            >
              รับทราบ
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white px-5 py-6 sm:p-8 border-b border-slate-100 flex flex-col gap-6 sm:gap-8">

        {/* Top Section: Poster & Info */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {project.posterUrl && (
            <div className="w-full md:w-64 shrink-0 sm:rounded-2xl overflow-hidden sm:shadow-md bg-slate-100 sm:border border-slate-200 aspect-[3/4]">
              <img src={project.posterUrl} alt={project.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <Link href="/" className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl flex items-center mb-6 text-sm font-medium transition-all w-fit shadow-sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> กลับหน้าหลัก
            </Link>
            <h1 className="text-3xl font-bold mb-2 text-slate-900">{project.title}</h1>
            <p className="text-slate-600 mb-6">{project.description}</p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
              {project.activityDate && (
                <div className="flex items-center text-slate-700">
                  <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                  <span>{formatThaiDateWithDay(project.activityDate)}</span>
                </div>
              )}
              {project.activityTime && (
                <div className="flex items-center text-slate-700">
                  <Clock className="w-4 h-4 mr-2 text-slate-500" />
                  <span>{project.activityTime}</span>
                </div>
              )}
              {project.activityLocation && (
                <div className="flex items-center text-slate-700">
                  <MapPin className="w-4 h-4 mr-2 text-slate-500" />
                  <span>{project.activityLocation}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Countdown & Stats */}
        <div className="bg-white px-5 sm:px-8 pb-6 sm:pb-8 animate-in fade-in zoom-in duration-500 delay-150 fill-mode-both">
          <CountdownTimer startDate={project.registrationStartDate} endDate={project.registrationEndDate} />


        </div>
      </div>

      <div className="px-5 py-6 sm:p-8">
        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm flex items-start">
            <span className="font-semibold mr-2">ข้อผิดพลาด:</span> {error}
          </div>
        )}

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
          {/* User Status Section */}
          {!session ? (
            <div className="bg-indigo-50 border border-indigo-100 p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">เข้าสู่ระบบเพื่อดำเนินการต่อ</h3>
                <p className="text-slate-600 text-sm">คุณต้องเข้าสู่ระบบก่อนจึงจะสามารถกรอกฟอร์มได้</p>
              </div>
              <form action={signInWithGoogle.bind(null, project.id)}>
                <button
                  type="submit"
                  className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-6 rounded-xl transition-all shadow-sm flex items-center shrink-0 border border-slate-200"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  เข้าสู่ระบบ
                </button>
              </form>
            </div>
          ) : !profile ? (
            <div className="bg-rose-50 border border-rose-100 p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <ShieldCheck className="w-8 h-8 text-rose-500 shrink-0" />
              <div className="flex-1 w-full flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-800">ไม่พบข้อมูลนักเรียน</h3>
                  <p className="text-slate-600 text-sm">อีเมล {session.user?.email} ยังไม่ได้รับการลงทะเบียนเป็นนักเรียนในระบบ</p>
                </div>
                <button
                  onClick={() => signOutAndRedirect(`/detail/${project.id}`)}
                  className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium py-2 px-4 rounded-lg text-sm transition-colors cursor-pointer shrink-0"
                >
                  เปลี่ยนบัญชี
                </button>
              </div>
            </div>
          ) : !isGradeAllowed ? (
            <div className="bg-rose-50 border border-rose-100 p-5 sm:p-6 rounded-2xl flex items-center gap-4">
              <ShieldCheck className="w-8 h-8 text-rose-500 shrink-0" />
              <div>
                <p className="text-slate-600 text-sm">
                  ระดับชั้น ม.{profile.grade} ไม่สามารถสมัครกิจกรรมนี้ได้ (รับเฉพาะ ม.{allowedGrades.join(', ม.')})
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200 relative text-center sm:text-left">
              <div className="w-12 h-12 bg-white text-slate-600 rounded-full flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-slate-800 font-bold">{profile.prefix}{profile.firstName} {profile.lastName}</p>
                <p className="text-slate-500 text-sm mt-0.5">ม.{profile.grade}/{profile.room} • เลขที่ {profile.number} • {profile.email}</p>
              </div>
              <form action={signOutAction} className="absolute top-6 right-6 sm:static sm:top-auto sm:right-auto">
                <button type="submit" className="text-xs bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 transition-colors shadow-sm">
                  ออกจากบัญชี
                </button>
              </form>
            </div>
          )}

          {/* Form Fields Section */}
          <form onSubmit={handleSubmitRegistration} className="space-y-8">
            {project.formFields.length > 0 && (
              <div className={!session || !profile || !isGradeAllowed ? "opacity-60 pointer-events-none" : ""}>
                <h3 className="text-lg font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">กรอกรายละเอียดเพิ่มเติม</h3>
                <div className="space-y-6">
                  {project.formFields.map((field) => (
                    <div key={field.id} className="bg-slate-50 p-3 sm:p-5 rounded-xl border border-slate-100">
                      <label className="block text-sm font-semibold text-slate-800 mb-3">
                        {field.label} {field.isRequired && <span className="text-rose-500">*</span>}
                      </label>
                      {field.type === 'SHORT_TEXT' && (
                        <input
                          type="text"
                          required={field.isRequired}
                          disabled={!session || !profile || !isGradeAllowed}
                          value={answers[field.id] || ""}
                          onChange={e => setAnswers({ ...answers, [field.id]: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-slate-900"
                          placeholder={`กรอก${field.label}`}
                        />
                      )}
                      {field.type === 'DROPDOWN' && field.options && (
                        <select
                          required={field.isRequired}
                          disabled={!session || !profile || !isGradeAllowed}
                          value={answers[field.id] || ""}
                          onChange={e => setAnswers({ ...answers, [field.id]: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-shadow text-slate-900"
                        >
                          <option value="" disabled className="text-slate-400">เลือกตัวเลือก...</option>
                          {JSON.parse(field.options).map((opt: string) => (
                            <option key={opt} value={opt} className="text-slate-900">{opt}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !session || !profile || !isGradeAllowed || !isRegistrationOpen}
              className={`w-full font-bold py-3 sm:py-4 px-4 rounded-xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-slate-900/10 ${!isRegistrationOpen
                ? "bg-slate-300 text-slate-600"
                : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : !isRegistrationOpen ? (
                isBeforeStart ? "ยังไม่เปิดรับสมัคร" : "ระบบปิดรับสมัครแล้ว"
              ) : (
                "ยืนยันการลงทะเบียนเข้าร่วม"
              )}
            </button>
          </form>
          {/* Real-time Stats */}
          <div className="mt-6 bg-slate-50 border border-slate-100 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-200">
              <div
                className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                style={{ width: `${stats.totalCapacity > 0 ? Math.min(100, (stats.totalRegistered / stats.totalCapacity) * 100) : 0}%` }}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 relative">
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-slate-600">
                    กำลังมีคนดูหน้านี้:
                  </span>
                  <span className="text-lg font-bold text-emerald-600">
                    {stats.viewersCount}
                  </span>
                  <span className="text-xs text-slate-500">คน</span>
                </div>
              </div>

              <div className="text-right flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">ยอดผู้ลงทะเบียน:</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-slate-800">{stats.totalRegistered}</span>
                  <span className="text-slate-400 font-medium text-sm">/</span>
                  <span className="text-slate-500 text-sm">{stats.totalCapacity || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
