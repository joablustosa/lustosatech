import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { authConfig } from "./auth.config";

declare module "next-auth" {
  interface User {
    tenantId?: string;
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      tenantId: string;
      role: string;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        // Email pode existir em mais de um tenant: valida a senha em cada um.
        const users = await prisma.adminUser.findMany({
          where: { email, active: true },
        });
        for (const user of users) {
          const ok = await bcrypt.compare(password, user.passwordHash);
          if (ok) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              tenantId: user.tenantId,
              role: user.role,
            };
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.tenantId = user.tenantId;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.tenantId = (token.tenantId as string) ?? "";
        session.user.role = (token.role as string) ?? "member";
      }
      return session;
    },
  },
});
