import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/admin/login",
  },
} satisfies NextAuthConfig
