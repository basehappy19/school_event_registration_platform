import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/admin/login",
    error: "/auth-error",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
  },
} satisfies NextAuthConfig
