"use server"

import { signIn, signOut } from "@/auth"
import { cookies } from "next/headers"
import { encodeProjectId } from "@/lib/id-codec"

export async function signInWithGoogle(projectId?: number) {
  if (projectId) {
    const cookieStore = await cookies()
    cookieStore.set("auth_return_url", `/detail/${encodeProjectId(projectId)}`, { maxAge: 3600 })
  }
  await signIn("google", { redirectTo: projectId ? `/detail/${encodeProjectId(projectId)}` : "/" })
}

export async function signInWithGoogleCustomRedirect(customUrl: string) {
  const cookieStore = await cookies()
  cookieStore.set("auth_return_url", customUrl, { maxAge: 3600 })
  await signIn("google", { redirectTo: customUrl })
}

export async function signOutAction() {
  await signOut()
}

export async function signOutAndRedirect(redirectTo: string) {
  await signOut({ redirectTo })
}
