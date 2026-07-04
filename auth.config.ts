import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  providers: [],
  pages: {
    error: "/auth-error",
  },
  session: {
    strategy: "jwt",
    maxAge: 3153600000, // 100 years (no expiration until manual logout)
  },
  jwt: {
    maxAge: 3153600000,
  },
} satisfies NextAuthConfig
