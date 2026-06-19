import { redirect } from "next/navigation"
import { auth } from "@/auth"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/admin/login")
  }
  
  if ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN") {
    // If a student tries to access admin, log them out or redirect to home
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Basic Admin Header could go here */}
      {children}
    </div>
  )
}
