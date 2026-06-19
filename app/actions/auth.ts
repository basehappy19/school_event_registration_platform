"use server"

import { signIn, signOut } from "@/auth"
import { cookies } from "next/headers"

export async function signInWithGoogle(projectId?: number) {
  if (projectId) {
    const cookieStore = await cookies()
    cookieStore.set("auth_return_url", `/detail/${projectId}`, { maxAge: 3600 })
  }
  await signIn("google", { redirectTo: projectId ? `/detail/${projectId}` : "/" })
}

export async function signOutAction(redirectTo?: string) {
  await signOut({ redirectTo })
}
