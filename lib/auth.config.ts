import type { NextAuthConfig } from "next-auth";

/**
 * Configuração base compartilhada — segura para o middleware (edge),
 * sem dependências de Node (Prisma/bcrypt ficam no auth.ts).
 */
export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      if (pathname.startsWith("/admin/login")) return true;
      if (pathname.startsWith("/admin")) return isLoggedIn;
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
