import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
  },
} satisfies NextAuthConfig
