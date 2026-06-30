### Task 3: Authentication System

**Files:**
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/lib/auth.ts`
- Create: `src/app/login/page.tsx`
- Create: `src/middleware.ts`
- Create: `src/app/api/auth/register/route.ts` (for seeding initial admin)
- Modify: `package.json` (add prisma seed config)

- [ ] **Step 1: Install bcryptjs**

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 2: Create auth configuration**

`src/lib/auth.ts`:
```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email },
        });
        if (!admin) return null;
        const isValid = await compare(credentials.password, admin.password);
        if (!isValid) return null;
        return { id: admin.id, email: admin.email, name: admin.name };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { (session.user as any).id = token.id; }
      return session;
    },
  },
};
```

NOTE: If the installed `next-auth` is v5 (beta), the API is different. Check `node_modules/next-auth/package.json` for the version. For v5 use:
```typescript
import NextAuth from "next-auth";
// authOptions stays the same but goes directly to NextAuth()

If NextAuth v5 is installed:
- `NextAuthOptions` type may not exist; use `import { type NextAuthConfig } from "next-auth"` or the function directly
- The middleware API also changed; next-auth/middleware may export differently
- Adapt based on the actual installed version
```

- [ ] **Step 3: Create NextAuth route handler**

`src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

- [ ] **Step 4: Create admin registration API (for seeding)**

`src/app/api/auth/register/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, name, password } = await req.json();
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "管理员已存在" }, { status: 400 });
    }
    const hashed = await hash(password, 12);
    const admin = await prisma.admin.create({
      data: { email, name, password: hashed },
    });
    return NextResponse.json({ id: admin.id, email: admin.email, name: admin.name });
  } catch {
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
```

- [ ] **Step 5: Create middleware**

`src/middleware.ts`:
```typescript
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      const path = req.nextUrl.pathname;
      if (path.startsWith("/admin")) return !!token;
      if (path.startsWith("/api/auth")) return true;
      if (path.startsWith("/api")) return !!token;
      return true;
    },
  },
});

export const config = {
  matcher: ["/admin/:path*", "/api/profiles/:path*", "/api/tests/:path*", "/api/match/:path*", "/api/introductions/:path*"],
};
```

- [ ] **Step 6: Create login page**

`src/app/login/page.tsx`:
```typescript
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError("邮箱或密码错误");
    } else {
      router.push("/admin/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">管理员登录</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full">登录</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 7: Create seed script to create initial admin**

`prisma/seed.ts`:
```typescript
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.admin.findUnique({ where: { email: "admin@xiangqin.com" } });
  if (!admin) {
    const password = await hash("admin123", 12);
    await prisma.admin.create({
      data: { email: "admin@xiangqin.com", name: "管理员", password },
    });
    console.log("Admin user created: admin@xiangqin.com / admin123");
  } else {
    console.log("Admin already exists");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

Update `package.json` to add:
```json
"prisma": { "seed": "tsx prisma/seed.ts" }
```

Install tsx:
```bash
npm install -D tsx
npx prisma db seed
```

- [ ] **Step 8: Test auth flow**

```bash
npm run dev
```

Visit http://localhost:3000/login, login with admin@xiangqin.com / admin123. Should redirect to /admin/dashboard (which will return 404, that's expected for now).
