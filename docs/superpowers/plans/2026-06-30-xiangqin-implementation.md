# 相亲网站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive dating website for family/friend-referred matchmaking with admin-driven matching and personality tests

**Architecture:** Next.js 14 App Router full-stack with Prisma ORM, SQLite database, and NextAuth authentication. Responsive design via Tailwind CSS + Shadcn/ui components.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui, Prisma, SQLite, NextAuth.js

## Global Constraints

- Use App Router (not Pages Router)
- All styling via Tailwind CSS utility classes
- Mobile-first responsive design (Tailwind breakpoints: sm/md/lg/xl)
- Chinese (Simplified) UI text throughout
- SQLite for local development
- No external UI component libraries beyond Shadcn/ui

---

### Task 1: Project Scaffolding

**Files:**
- Create: (entire project via `npx create-next-app`)
- Create: `src/lib/prisma.ts`
- Create: `src/lib/utils.ts`
- Modify: `tailwind.config.ts`
- Modify: `tsconfig.json`
- Create: `.env`

- [ ] **Step 1: Create Next.js project**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Choose: TypeScript Yes, ESLint Yes, Tailwind Yes, `src/` directory Yes, App Router Yes, import alias `@/*` Yes

- [ ] **Step 2: Install dependencies**

```bash
npm install prisma @prisma/client next-auth @auth/prisma-adapter
npm install -D @types/node
npx shadcn@latest init
```

When shadcn prompts: choose "New York" style, "Zinc" base color, CSS variables for theming.

- [ ] **Step 3: Install shadcn components needed**

```bash
npx shadcn@latest add button card input label select table dialog form toast separator avatar badge textarea
```

- [ ] **Step 4: Create Prisma client singleton**

`src/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 5: Create utility file**

`src/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 6: Create .env**

`.env`:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="dev-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 7: Verify project runs**

```bash
npm run dev
```

Expected: Next.js dev server starts on http://localhost:3000

---

### Task 2: Database Schema

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Write Prisma schema**

`prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Admin {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  createdAt DateTime @default(now())
}

model Profile {
  id           String   @id @default(cuid())
  name         String
  gender       String
  age          Int
  area         String
  occupation   String
  photos       String   // JSON array of photo URLs
  wechat       String?
  phone        String?
  requirement  String   // 择偶要求
  background   String?  // 基本情况介绍
  status       String   @default("pending") // pending | approved | rejected
  referrerName String   // 推荐人/亲友姓名
  referrerRelation String // 与征婚人关系
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  testAnswers  TestAnswer[]
  introductionsGiven  Introduction[] @relation("GivenProfile")
  introductionsReceived Introduction[] @relation("ReceivedProfile")
}

model TestQuestion {
  id       String   @id @default(cuid())
  title    String   // 题目内容
  dimension String  // 维度标签: 外向, 理性, 感性, 细心等
  options  String   // JSON array of {text, score}
  sortOrder Int     @default(0)
  createdAt DateTime @default(now())
}

model TestAnswer {
  id         String   @id @default(cuid())
  profileId  String
  questionId String
  score      Int
  createdAt  DateTime @default(now())
  profile    Profile  @relation(fields: [profileId], references: [id])
  question   TestQuestion @relation(fields: [questionId], references: [id])
}

model Introduction {
  id           String   @id @default(cuid())
  givenById    String   // 被推荐方A
  receivedById String   // 被推荐方B
  adminId      String
  status       String   @default("pending") // pending | accepted | rejected
  message      String?  // 管理员推荐语
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  givenBy      Profile  @relation("GivenProfile", fields: [givenById], references: [id])
  receivedBy   Profile  @relation("ReceivedProfile", fields: [receivedById], references: [id])
  admin        Admin    @relation(fields: [adminId], references: [id])
}
```

- [ ] **Step 2: Run Prisma migration**

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Expected: Migration creates SQLite database file, Prisma client generates

---

### Task 3: Authentication System

**Files:**
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/lib/auth.ts`
- Create: `src/app/login/page.tsx`
- Create: `src/middleware.ts`
- Create: `src/app/api/auth/register/route.ts` (for seeding initial admin)

- [ ] **Step 1: Create auth configuration**

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

- [ ] **Step 2: Create NextAuth route handler**

`src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

- [ ] **Step 3: Create admin registration API (for seeding)**

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

- [ ] **Step 4: Create middleware**

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

- [ ] **Step 5: Create login page**

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

- [ ] **Step 6: Create seed script to create initial admin**

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

- [ ] **Step 7: Test auth flow**

```bash
npm run dev
```

Visit http://localhost:3000/login, login with admin@xiangqin.com / admin123. Should redirect to /admin/dashboard (which will 404 for now, that's expected).

---

### Task 4: Admin Layout & Navigation

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/dashboard/page.tsx`
- Create: `src/components/admin/sidebar.tsx`
- Create: `src/components/admin/header.tsx`

- [ ] **Step 1: Create admin layout**

`src/app/admin/layout.tsx`:
```typescript
import { Sidebar } from "@/components/admin/sidebar";
import { Header } from "@/components/admin/header";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create sidebar component**

`src/components/admin/sidebar.tsx`:
```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "仪表盘" },
  { href: "/admin/profiles", label: "资料管理" },
  { href: "/admin/tests", label: "性格测试" },
  { href: "/admin/match", label: "匹配推荐" },
  { href: "/admin/introductions", label: "牵线管理" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r hidden lg:block">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-pink-600">相亲平台</h1>
      </div>
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block px-4 py-2 rounded-lg text-sm transition-colors",
              pathname.startsWith(item.href)
                ? "bg-pink-50 text-pink-600 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 3: Create header with mobile menu**

`src/components/admin/header.tsx`:
```typescript
"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "仪表盘" },
  { href: "/admin/profiles", label: "资料管理" },
  { href: "/admin/tests", label: "性格测试" },
  { href: "/admin/match", label: "匹配推荐" },
  { href: "/admin/introductions", label: "牵线管理" },
];

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b px-6 py-3 flex items-center justify-between lg:justify-end">
      <button className="lg:hidden text-2xl" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{session?.user?.name}</span>
        <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>退出</Button>
      </div>
      {menuOpen && (
        <div className="fixed inset-0 top-16 z-50 bg-white p-6 lg:hidden">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn("block px-4 py-3 rounded-lg text-sm")}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 4: Create dashboard page**

`src/app/admin/dashboard/page.tsx`:
```typescript
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [total, pending, approved, introductions] = await Promise.all([
    prisma.profile.count(),
    prisma.profile.count({ where: { status: "pending" } }),
    prisma.profile.count({ where: { status: "approved" } }),
    prisma.introduction.count(),
  ]);

  const stats = [
    { label: "总资料数", value: total },
    { label: "待审核", value: pending },
    { label: "已通过", value: approved },
    { label: "牵线记录", value: introductions },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">仪表盘</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-6 shadow-sm border">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update root layout**

`src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "相亲平台",
  description: "亲友介绍型婚恋平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Create providers wrapper**

`src/app/providers.tsx`:
```typescript
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

---

### Task 5: Profile Management

**Files:**
- Create: `src/app/api/profiles/route.ts`
- Create: `src/app/api/profiles/[id]/route.ts`
- Create: `src/app/api/profiles/[id]/status/route.ts`
- Create: `src/app/admin/profiles/page.tsx`
- Create: `src/app/admin/profiles/create/page.tsx`
- Create: `src/app/admin/profiles/[id]/page.tsx`
- Create: `src/components/admin/profile-form.tsx`
- Create: `src/components/admin/profile-card.tsx`

- [ ] **Step 1: Create profiles API (list + create)**

`src/app/api/profiles/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where = status ? { status } : {};
  const profiles = await prisma.profile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { testAnswers: true } } },
  });
  return NextResponse.json(profiles);
}

export async function POST(req: Request) {
  const body = await req.json();
  const profile = await prisma.profile.create({
    data: {
      name: body.name,
      gender: body.gender,
      age: parseInt(body.age),
      area: body.area,
      occupation: body.occupation,
      photos: JSON.stringify(body.photos || []),
      wechat: body.wechat || null,
      phone: body.phone || null,
      requirement: body.requirement,
      background: body.background || null,
      referrerName: body.referrerName,
      referrerRelation: body.referrerRelation,
    },
  });
  return NextResponse.json(profile);
}
```

- [ ] **Step 2: Create single profile API**

`src/app/api/profiles/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const profile = await prisma.profile.findUnique({
    where: { id: params.id },
    include: {
      testAnswers: {
        include: { question: true },
      },
    },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const profile = await prisma.profile.update({
    where: { id: params.id },
    data: {
      name: body.name,
      gender: body.gender,
      age: parseInt(body.age),
      area: body.area,
      occupation: body.occupation,
      photos: JSON.stringify(body.photos || []),
      wechat: body.wechat || null,
      phone: body.phone || null,
      requirement: body.requirement,
      background: body.background || null,
      referrerName: body.referrerName,
      referrerRelation: body.referrerRelation,
    },
  });
  return NextResponse.json(profile);
}
```

- [ ] **Step 3: Create status update API**

`src/app/api/profiles/[id]/status/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { status } = await req.json();
  if (!["pending", "approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const profile = await prisma.profile.update({
    where: { id: params.id },
    data: { status },
  });
  return NextResponse.json(profile);
}
```

- [ ] **Step 4: Create profile form component**

`src/components/admin/profile-form.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileFormProps {
  initialData?: any;
  profileId?: string;
}

export function ProfileForm({ initialData, profileId }: ProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initialData?.name || "",
    gender: initialData?.gender || "男",
    age: initialData?.age?.toString() || "",
    area: initialData?.area || "",
    occupation: initialData?.occupation || "",
    wechat: initialData?.wechat || "",
    phone: initialData?.phone || "",
    requirement: initialData?.requirement || "",
    background: initialData?.background || "",
    referrerName: initialData?.referrerName || "",
    referrerRelation: initialData?.referrerRelation || "",
    photos: initialData ? JSON.parse(initialData.photos || "[]").join(", ") : "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = profileId ? `/api/profiles/${profileId}` : "/api/profiles";
    const method = profileId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        age: parseInt(form.age),
        photos: form.photos.split(",").map(s => s.trim()).filter(Boolean),
      }),
    });
    if (res.ok) {
      router.push("/admin/profiles");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{profileId ? "编辑资料" : "新建资料"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>姓名</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>性别</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>年龄</Label>
            <Input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>地区</Label>
            <Input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>职业</Label>
            <Input value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>微信号</Label>
            <Input value={form.wechat} onChange={e => setForm({ ...form, wechat: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>手机号</Label>
            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>照片URL（逗号分隔）</Label>
            <Input value={form.photos} onChange={e => setForm({ ...form, photos: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>推荐人姓名</Label>
            <Input value={form.referrerName} onChange={e => setForm({ ...form, referrerName: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>与征婚人关系</Label>
            <Input value={form.referrerRelation} onChange={e => setForm({ ...form, referrerRelation: e.target.value })} required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>基本情况介绍</Label>
            <Textarea value={form.background} onChange={e => setForm({ ...form, background: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>择偶要求</Label>
            <Textarea value={form.requirement} onChange={e => setForm({ ...form, requirement: e.target.value })} required />
          </div>
          <div className="md:col-span-2 flex gap-2">
            <Button type="submit">{profileId ? "保存" : "创建"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>取消</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Create profile list page**

`src/app/admin/profiles/page.tsx`:
```typescript
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "@/components/admin/profile-card";

export default async function ProfilesPage() {
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">资料管理</h2>
        <Link href="/admin/profiles/create">
          <Button>新建资料</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((p) => (
          <ProfileCard key={p.id} profile={p} />
        ))}
      </div>
      {profiles.length === 0 && (
        <p className="text-center text-gray-400 py-12">暂无资料</p>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create profile card component**

`src/components/admin/profile-card.tsx`:
```typescript
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "待审核", variant: "secondary" },
  approved: { label: "已通过", variant: "default" },
  rejected: { label: "已拒绝", variant: "destructive" },
};

export function ProfileCard({ profile }: { profile: any }) {
  const status = statusMap[profile.status] || statusMap.pending;

  return (
    <Link href={`/admin/profiles/${profile.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg">{profile.name}</h3>
              <p className="text-sm text-gray-500">{profile.gender} · {profile.age}岁 · {profile.area}</p>
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{profile.occupation}</p>
          <p className="text-xs text-gray-400 mt-2">推荐人: {profile.referrerName} ({profile.referrerRelation})</p>
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 7: Create profile detail page**

`src/app/admin/profiles/[id]/page.tsx`:
```typescript
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProfileDetail } from "@/components/admin/profile-detail";

export default async function ProfileDetailPage({ params }: { params: { id: string } }) {
  const profile = await prisma.profile.findUnique({
    where: { id: params.id },
    include: { testAnswers: { include: { question: true } } },
  });
  if (!profile) notFound();
  return <ProfileDetail profile={profile} />;
}
```

`src/components/admin/profile-detail.tsx`:
```typescript
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "待审核", variant: "secondary" },
  approved: { label: "已通过", variant: "default" },
  rejected: { label: "已拒绝", variant: "destructive" },
};

export function ProfileDetail({ profile }: { profile: any }) {
  const router = useRouter();
  const status = statusMap[profile.status] || statusMap.pending;
  const photos = JSON.parse(profile.photos || "[]");

  async function updateStatus(status: string) {
    await fetch(`/api/profiles/${profile.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">资料详情</h2>
        <div className="flex gap-2">
          {profile.status === "pending" && (
            <>
              <Button onClick={() => updateStatus("approved")} className="bg-green-600">通过</Button>
              <Button onClick={() => updateStatus("rejected")} variant="destructive">拒绝</Button>
            </>
          )}
          <Button variant="outline" onClick={() => router.push(`/admin/profiles/${profile.id}/edit`)}>编辑</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {profile.name}
              <Badge variant={status.variant}>{status.label}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="性别" value={profile.gender} />
            <InfoRow label="年龄" value={`${profile.age}岁`} />
            <InfoRow label="地区" value={profile.area} />
            <InfoRow label="职业" value={profile.occupation} />
            <InfoRow label="微信号" value={profile.wechat || "未填写"} />
            <InfoRow label="手机号" value={profile.phone || "未填写"} />
            <InfoRow label="推荐人" value={`${profile.referrerName} (${profile.referrerRelation})`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>详细介绍</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">基本情况</p>
              <p className="text-sm">{profile.background || "未填写"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">择偶要求</p>
              <p className="text-sm">{profile.requirement}</p>
            </div>
            {photos.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">照片</p>
                <div className="flex gap-2 flex-wrap">
                  {photos.map((url: string, i: number) => (
                    <img key={i} src={url} alt={`photo-${i}`} className="w-24 h-24 object-cover rounded-lg" />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {profile.testAnswers?.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>性格测试结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profile.testAnswers.map((a: any) => (
                  <div key={a.id} className="flex justify-between text-sm py-1 border-b">
                    <span>{a.question.title}</span>
                    <span className="text-gray-500">{a.question.dimension}: {a.score}分</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}
```

---

### Task 6: Personality Test System

**Files:**
- Create: `src/app/api/tests/route.ts`
- Create: `src/app/api/tests/[id]/route.ts`
- Create: `src/app/api/tests/submit/route.ts`
- Create: `src/app/admin/tests/page.tsx`
- Create: `src/app/test/[profileId]/page.tsx`
- Create: `src/components/admin/test-question-form.tsx`

- [ ] **Step 1: Create test questions API**

`src/app/api/tests/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const questions = await prisma.testQuestion.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(questions);
}

export async function POST(req: Request) {
  const body = await req.json();
  const question = await prisma.testQuestion.create({
    data: {
      title: body.title,
      dimension: body.dimension,
      options: JSON.stringify(body.options),
      sortOrder: body.sortOrder || 0,
    },
  });
  return NextResponse.json(question);
}
```

- [ ] **Step 2: Create single question API**

`src/app/api/tests/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const question = await prisma.testQuestion.update({
    where: { id: params.id },
    data: {
      title: body.title,
      dimension: body.dimension,
      options: JSON.stringify(body.options),
      sortOrder: body.sortOrder,
    },
  });
  return NextResponse.json(question);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await prisma.testQuestion.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create submit answer API**

`src/app/api/tests/submit/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { profileId, answers } = await req.json();

  // Delete existing answers for this profile
  await prisma.testAnswer.deleteMany({ where: { profileId } });

  // Create new answers
  await prisma.testAnswer.createMany({
    data: answers.map((a: { questionId: string; score: number }) => ({
      profileId,
      questionId: a.questionId,
      score: a.score,
    })),
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Create admin test management page**

`src/app/admin/tests/page.tsx`:
```typescript
import { prisma } from "@/lib/prisma";
import { TestQuestionList } from "@/components/admin/test-question-list";

export default async function TestsPage() {
  const questions = await prisma.testQuestion.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">性格测试管理</h2>
      <TestQuestionList questions={questions} />
    </div>
  );
}
```

`src/components/admin/test-question-list.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TestQuestionForm } from "./test-question-form";

export function TestQuestionList({ questions: initial }: { questions: any[] }) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initial);
  const [editing, setEditing] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm("确定删除这道题？")) return;
    await fetch(`/api/tests/${id}`, { method: "DELETE" });
    setQuestions(questions.filter((q) => q.id !== id));
    router.refresh();
  }

  async function handleSave(data: any, id?: string) {
    if (id) {
      await fetch(`/api/tests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setDialogOpen(false);
    setEditing(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => setEditing(null)}>新增题目</Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑题目" : "新增题目"}</DialogTitle>
          </DialogHeader>
          <TestQuestionForm
            initialData={editing}
            onSave={(data) => handleSave(data, editing?.id)}
          />
        </DialogContent>
      </Dialog>

      {questions.map((q) => {
        const options = JSON.parse(q.options || "[]");
        return (
          <Card key={q.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium">{q.title}</p>
                  <p className="text-sm text-gray-500 mt-1">维度: {q.dimension}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {options.map((o: any, i: number) => (
                      <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{o.text} ({o.score}分)</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditing(q); setDialogOpen(true); }}>编辑</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(q.id)}>删除</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {questions.length === 0 && <p className="text-center text-gray-400 py-8">暂无题目</p>}
    </div>
  );
}
```

`src/components/admin/test-question-form.tsx`:
```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Option {
  text: string;
  score: number;
}

export function TestQuestionForm({ initialData, onSave }: { initialData?: any; onSave: (data: any) => void }) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [dimension, setDimension] = useState(initialData?.dimension || "");
  const [options, setOptions] = useState<Option[]>(
    initialData ? JSON.parse(initialData.options || "[]") : [{ text: "", score: 1 }, { text: "", score: 2 }, { text: "", score: 3 }, { text: "", score: 4 }, { text: "", score: 5 }]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ title, dimension, options, sortOrder: initialData?.sortOrder || 0 });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>题目内容</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>维度标签（如：外向、理性、感性、细心）</Label>
        <Input value={dimension} onChange={e => setDimension(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>选项（1-5分，李克特量表）</Label>
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              placeholder="选项文本"
              value={opt.text}
              onChange={e => {
                const newOpts = [...options];
                newOpts[i] = { ...newOpts[i], text: e.target.value };
                setOptions(newOpts);
              }}
              required
            />
            <Input
              type="number"
              className="w-20"
              placeholder="分值"
              value={opt.score}
              onChange={e => {
                const newOpts = [...options];
                newOpts[i] = { ...newOpts[i], score: parseInt(e.target.value) || 0 };
                setOptions(newOpts);
              }}
              required
            />
          </div>
        ))}
      </div>
      <Button type="submit">保存</Button>
    </form>
  );
}
```

- [ ] **Step 5: Create public test answering page**

`src/app/test/[profileId]/page.tsx`:
```typescript
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TestForm } from "./test-form";

export default async function TestPage({ params }: { params: { profileId: string } }) {
  const profile = await prisma.profile.findUnique({ where: { id: params.profileId } });
  if (!profile) notFound();

  const questions = await prisma.testQuestion.findMany({ orderBy: { sortOrder: "asc" } });
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">暂无测试题目，请联系管理员</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">性格测试</h1>
          <p className="text-gray-500 mt-2">{profile.name}，请根据实际情况选择</p>
        </div>
        <TestForm profileId={params.profileId} questions={questions} />
      </div>
    </div>
  );
}
```

`src/app/test/[profileId]/test-form.tsx`:
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Question {
  id: string;
  title: string;
  dimension: string;
  options: string;
}

export function TestForm({ profileId, questions }: { profileId: string; questions: Question[] }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    const answerList = Object.entries(answers).map(([questionId, score]) => ({
      questionId,
      score,
    }));

    await fetch(`/api/tests/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, answers: answerList }),
    });

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-xl text-green-600 font-semibold">提交成功！</p>
          <p className="text-gray-500 mt-2">感谢您的参与</p>
        </CardContent>
      </Card>
    );
  }

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="space-y-4">
      {questions.map((q, idx) => {
        const options = JSON.parse(q.options);
        return (
          <Card key={q.id}>
            <CardContent className="p-4">
              <p className="font-medium mb-3">
                {idx + 1}. {q.title}
                <span className="text-xs text-gray-400 ml-2">({q.dimension})</span>
              </p>
              <div className="space-y-2">
                {options.map((opt: any) => (
                  <label
                    key={opt.score}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      answers[q.id] === opt.score ? "bg-pink-50 border-pink-200" : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id] === opt.score}
                      onChange={() => setAnswers({ ...answers, [q.id]: opt.score })}
                      className="accent-pink-500"
                    />
                    <span className="text-sm">{opt.text}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
      <Button onClick={handleSubmit} className="w-full" disabled={!allAnswered}>
        {allAnswered ? "提交测试" : `请完成所有题目 (${Object.keys(answers).length}/${questions.length})`}
      </Button>
    </div>
  );
}
```

---

### Task 7: Matching System

**Files:**
- Create: `src/app/api/match/route.ts`
- Create: `src/app/admin/match/page.tsx`
- Create: `src/components/admin/match-view.tsx`

- [ ] **Step 1: Create match API**

`src/app/api/match/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gender = searchParams.get("gender");
  const minAge = searchParams.get("minAge");
  const maxAge = searchParams.get("maxAge");
  const area = searchParams.get("area");

  const where: any = { status: "approved" };
  if (gender) where.gender = gender;
  if (minAge || maxAge) {
    where.age = {};
    if (minAge) where.age.gte = parseInt(minAge);
    if (maxAge) where.age.lte = parseInt(maxAge);
  }
  if (area) where.area = { contains: area };

  const profiles = await prisma.profile.findMany({
    where,
    include: {
      testAnswers: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(profiles);
}
```

- [ ] **Step 2: Create match page**

`src/app/admin/match/page.tsx`:
```typescript
import { MatchView } from "@/components/admin/match-view";

export default function MatchPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">匹配推荐</h2>
      <MatchView />
    </div>
  );
}
```

`src/components/admin/match-view.tsx`:
```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  name: string;
  gender: string;
  age: number;
  area: string;
  occupation: string;
  requirement: string;
  background: string | null;
  referrerName: string;
  testAnswers: { questionId: string; score: number }[];
}

export function MatchView() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [gender, setGender] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [area, setArea] = useState("");

  async function loadProfiles() {
    const params = new URLSearchParams();
    if (gender) params.set("gender", gender);
    if (minAge) params.set("minAge", minAge);
    if (maxAge) params.set("maxAge", maxAge);
    if (area) params.set("area", area);
    const res = await fetch(`/api/match?${params}`);
    const data = await res.json();
    setProfiles(data);
  }

  useEffect(() => { loadProfiles(); }, []);

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function initiateIntroduction() {
    if (selected.length !== 2) return alert("请选择两位征婚人");
    const res = await fetch("/api/introductions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ givenById: selected[0], receivedById: selected[1] }),
    });
    if (res.ok) {
      alert("牵线已发起！");
      setSelected([]);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={gender} onChange={e => setGender(e.target.value)}>
              <option value="">全部性别</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
            <Input placeholder="最小年龄" type="number" value={minAge} onChange={e => setMinAge(e.target.value)} />
            <Input placeholder="最大年龄" type="number" value={maxAge} onChange={e => setMaxAge(e.target.value)} />
            <Input placeholder="地区" value={area} onChange={e => setArea(e.target.value)} />
          </div>
          <Button onClick={loadProfiles} className="mt-3">筛选</Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">已选择 {selected.length} 人（需选2人发起牵线）</p>
        <Button onClick={initiateIntroduction} disabled={selected.length !== 2}>发起牵线</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((p) => {
          const isSelected = selected.includes(p.id);
          return (
            <Card
              key={p.id}
              className={`cursor-pointer transition-all ${
                isSelected ? "ring-2 ring-pink-500" : "hover:shadow-md"
              }`}
              onClick={() => toggleSelect(p.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-sm text-gray-500">{p.gender} · {p.age}岁 · {p.area}</p>
                  </div>
                  {isSelected && <Badge>已选</Badge>}
                </div>
                <p className="text-sm text-gray-600">{p.occupation}</p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">推荐人: {p.referrerName}</p>
                {p.testAnswers.length > 0 && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {calculateDimensions(p.testAnswers).map((d) => (
                      <span key={d.dimension} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                        {d.dimension}: {d.avgScore.toFixed(1)}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {profiles.length === 0 && (
        <p className="text-center text-gray-400 py-8">暂无符合条件的资料</p>
      )}
    </div>
  );
}

function calculateDimensions(answers: { questionId: string; score: number }[]) {
  // This is a simplified version - in reality would need to group by dimension
  // For now, returns a placeholder
  return [{ dimension: "综合", avgScore: answers.reduce((s, a) => s + a.score, 0) / answers.length }];
}
```

---

### Task 8: Introduction Flow

**Files:**
- Create: `src/app/api/introductions/route.ts`
- Create: `src/app/api/introductions/[id]/route.ts`
- Create: `src/app/admin/introductions/page.tsx`
- Create: `src/components/admin/introductions-list.tsx`
- Create: `src/app/introduction/[id]/page.tsx` (public page for family confirmation)

- [ ] **Step 1: Create introductions API**

`src/app/api/introductions/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const introductions = await prisma.introduction.findMany({
    include: {
      givenBy: true,
      receivedBy: true,
      admin: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(introductions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { givenById, receivedById, message } = await req.json();
  const introduction = await prisma.introduction.create({
    data: {
      givenById,
      receivedById,
      adminId: (session.user as any).id,
      message: message || null,
    },
  });
  return NextResponse.json(introduction);
}
```

- [ ] **Step 2: Create single introduction API**

`src/app/api/introductions/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { status } = await req.json();
  if (!["pending", "accepted", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const introduction = await prisma.introduction.update({
    where: { id: params.id },
    data: { status },
  });
  return NextResponse.json(introduction);
}
```

- [ ] **Step 3: Create introductions admin page**

`src/app/admin/introductions/page.tsx`:
```typescript
import { prisma } from "@/lib/prisma";
import { IntroductionsList } from "@/components/admin/introductions-list";

export default async function IntroductionsPage() {
  const introductions = await prisma.introduction.findMany({
    include: {
      givenBy: { select: { name: true, gender: true, age: true } },
      receivedBy: { select: { name: true, gender: true, age: true } },
      admin: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">牵线管理</h2>
      <IntroductionsList introductions={introductions} />
    </div>
  );
}
```

`src/components/admin/introductions-list.tsx`:
```typescript
"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "待确认", variant: "secondary" },
  accepted: { label: "已通过", variant: "default" },
  rejected: { label: "已拒绝", variant: "destructive" },
};

export function IntroductionsList({ introductions }: { introductions: any[] }) {
  const router = useRouter();

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/introductions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {introductions.map((item) => {
        const status = statusMap[item.status] || statusMap.pending;
        return (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {item.givenBy.name} ({item.givenBy.gender}, {item.givenBy.age})
                    <span className="mx-2 text-gray-400">⇄</span>
                    {item.receivedBy.name} ({item.receivedBy.gender}, {item.receivedBy.age})
                  </p>
                  {item.message && (
                    <p className="text-sm text-gray-500 mt-1">推荐语: {item.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">管理员: {item.admin.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  {item.status === "pending" && (
                    <>
                      <Button size="sm" className="bg-green-600" onClick={() => updateStatus(item.id, "accepted")}>通过</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(item.id, "rejected")}>拒绝</Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {introductions.length === 0 && (
        <p className="text-center text-gray-400 py-8">暂无牵线记录</p>
      )}
    </div>
  );
}
```

---
