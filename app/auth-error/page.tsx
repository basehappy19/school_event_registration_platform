import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const cookieStore = await cookies()
  const returnUrl = cookieStore.get("auth_return_url")?.value || "/"
  
  const errorMessage = error || "AccessDenied"
  redirect(`${returnUrl}?error=${errorMessage}`)
}
