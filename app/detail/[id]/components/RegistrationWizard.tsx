"use client"

import { useState } from "react"
import { getStudentProfile } from "@/app/actions/student"
import { submitRegistration } from "@/app/actions/registration"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, UserCheck, ShieldCheck, Loader2 } from "lucide-react"
import Link from "next/link"

export default function RegistrationWizard({ project }: { project: any }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Auth State
  const [studentId, setStudentId] = useState("")
  const [nationalIdSuffix, setNationalIdSuffix] = useState("")

  // Profile State (autofilled)
  const [profile, setProfile] = useState<any>(null)
  
  // Custom Answers State
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await getStudentProfile(studentId, nationalIdSuffix)
    if (res.error) {
      if (res.error === "Missing credentials") setError("กรุณากรอกข้อมูลให้ครบถ้วน")
      else if (res.error === "Student not found") setError("ไม่พบข้อมูลนักเรียน")
      else if (res.error === "Invalid National ID suffix") setError("เลขบัตรประชาชน 5 หลักสุดท้ายไม่ถูกต้อง")
      else setError(res.error)
    } else if (res.data) {
      const allowedGrades = project.quotas.map((q: any) => q.grade)
      if (!allowedGrades.includes(res.data.grade)) {
        setError(`ระดับชั้น ม.${res.data.grade} ไม่สามารถสมัครกิจกรรมนี้ได้ (รับเฉพาะ ม.${allowedGrades.join(', ม.')})`)
      } else {
        setProfile(res.data)
        setStep(2)
      }
    }
    setLoading(false)
  }

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formAnswers = Object.entries(answers).map(([fieldId, value]) => ({
      fieldId,
      value
    }))

    const payload = {
      projectId: project.id,
      studentId,
      nationalIdSuffix,
      formAnswers
    }

    const res = await submitRegistration(payload)
    if ('error' in res) {
      setError(res.error)
      setLoading(false)
    } else {
      router.push(`/detail/${project.id}/success?status=${res.status}`)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white">
        <Link href="/" className="inline-flex items-center text-indigo-100 hover:text-white transition-colors text-sm font-medium mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> กลับหน้าหลัก
        </Link>
        <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
        <p className="text-indigo-100 opacity-90">{project.description}</p>
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm flex items-start">
            <span className="font-semibold mr-2">ข้อผิดพลาด:</span> {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">ยืนยันตัวตนนักเรียน</h2>
              <p className="text-slate-500 mt-2">กรอกข้อมูลของคุณเพื่อดึงข้อมูลลงในแบบฟอร์มสมัครโดยอัตโนมัติอย่างปลอดภัย</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">เลขประจำตัวนักเรียน</label>
              <input 
                type="text" 
                required 
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="เช่น 66001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">เลขบัตรประจำตัวประชาชน 5 หลักสุดท้าย</label>
              <input 
                type="password" 
                required 
                maxLength={5}
                value={nationalIdSuffix}
                onChange={e => setNationalIdSuffix(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="•••••"
              />
              <p className="text-xs text-slate-400 mt-2 text-right">ใช้สำหรับการยืนยันตัวตนเท่านั้น จะไม่ถูกจัดเก็บในรูปแบบข้อความธรรมดา (Plain text)</p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center disabled:opacity-70 mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>ยืนยันตัวตนและดำเนินการต่อ <ArrowRight className="w-5 h-5 ml-2" /></>
              )}
            </button>
          </form>
        )}

        {step === 2 && profile && (
          <form onSubmit={handleSubmitRegistration} className="space-y-8">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-700">ยืนยันตัวตนสำเร็จ</p>
                <p className="text-slate-800 font-bold">{profile.prefix}{profile.firstName} {profile.lastName}</p>
                <p className="text-slate-500 text-sm">ม.{profile.grade}/{profile.room} • เลขที่ {profile.number}</p>
              </div>
            </div>

            {project.formFields.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">ข้อมูลเพิ่มเติม</h3>
                <div className="space-y-5">
                  {project.formFields.map((field: any) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {field.label} {field.isRequired && <span className="text-rose-500">*</span>}
                      </label>
                      {field.type === 'SHORT_TEXT' && (
                        <input 
                          type="text" 
                          required={field.isRequired}
                          value={answers[field.id] || ""}
                          onChange={e => setAnswers({...answers, [field.id]: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      )}
                      {field.type === 'DROPDOWN' && field.options && (
                        <select 
                          required={field.isRequired}
                          value={answers[field.id] || ""}
                          onChange={e => setAnswers({...answers, [field.id]: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                          <option value="" disabled>เลือกตัวเลือก...</option>
                          {JSON.parse(field.options).map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
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
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 px-4 rounded-xl transition-all flex items-center justify-center disabled:opacity-70 shadow-lg shadow-slate-900/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ยืนยันการลงทะเบียน"}
            </button>
            <p className="text-center text-xs text-slate-400 mt-4">เมื่อกดยืนยัน ถือว่าท่านยอมรับนโยบายความเป็นส่วนตัวเกี่ยวกับการเก็บรวบรวมข้อมูลของเรา</p>
          </form>
        )}
      </div>
    </div>
  )
}
