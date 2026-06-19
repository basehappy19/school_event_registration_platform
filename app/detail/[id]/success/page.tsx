import Link from "next/link"
import { CheckCircle2, Clock, ArrowLeft } from "lucide-react"

export default async function SuccessPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ status?: string }> 
}) {
  const { status } = await searchParams
  
  const isApproved = status === "APPROVED"

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 max-w-md w-full text-center">
        {isApproved ? (
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        ) : (
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10" />
          </div>
        )}

        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
          {isApproved ? "Registration Approved!" : "You're on the Waitlist"}
        </h1>
        
        <p className="text-slate-600 mb-8">
          {isApproved 
            ? "Your spot has been secured successfully. You will receive further instructions soon." 
            : "The event capacity is currently full. We have securely saved your spot in the queue, and you will be automatically promoted if someone cancels."}
        </p>

        <div className="bg-slate-50 rounded-2xl p-4 mb-8 text-sm text-slate-500 border border-slate-100">
          <p>Please screenshot this page or save your URL as confirmation.</p>
        </div>

        <Link 
          href="/"
          className="inline-flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Return to Home
        </Link>
      </div>
    </div>
  )
}
