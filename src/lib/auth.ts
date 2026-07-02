import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";
import { rateLimit, getClientIp } from "./rate-limit";

export type Role = "admin" | "user";

// 10 login attempts per IP per 10 minutes.
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW = 10 * 60 * 1000;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const ip = getClientIp((req?.headers ?? {}) as Record<string, string>);
        const { ok } = rateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW);
        // Rate-limited: fail without revealing the reason (brute-force block).
        if (!ok) return null;

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
        });
        if (admin) {
          const isValid = await compare(credentials.password, admin.password);
          if (!isValid) return null;
          return { id: admin.id, email: admin.email, name: admin.name, role: "admin" as Role };
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (user) {
          const isValid = await compare(credentials.password, user.password);
          if (!isValid) return null;
          return { id: user.id, email: user.email, name: user.name, role: "user" as Role };
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id;
        if (token.role) session.user.role = token.role;
      }
      return session;
    },
  },
};
