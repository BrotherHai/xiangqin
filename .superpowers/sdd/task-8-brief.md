### Task 8: Introduction Flow

**Files:**
- Create: `src/app/api/introductions/route.ts`
- Create: `src/app/api/introductions/[id]/route.ts`
- Create: `src/app/admin/introductions/page.tsx`
- Create: `src/components/admin/introductions-list.tsx`
- Create: `src/app/introduction/[id]/page.tsx` (public page for family confirmation)

Step 1: Create introductions API

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

Step 2: Create single introduction API

`src/app/api/introductions/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json();
  if (!["pending", "accepted", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const introduction = await prisma.introduction.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json(introduction);
}
```

Step 3: Create introductions admin page

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
import { Card, CardContent } from "@/components/ui/card";

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

Step 4: Create public introduction confirmation page

`src/app/introduction/[id]/page.tsx`:
```typescript
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function IntroductionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const introduction = await prisma.introduction.findUnique({
    where: { id },
    include: {
      givenBy: true,
      receivedBy: true,
      admin: { select: { name: true } },
    },
  });
  if (!introduction) notFound();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">牵线详情</h1>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold">{introduction.givenBy.name}</p>
              <p className="text-sm text-gray-500">
                {introduction.givenBy.gender} · {introduction.givenBy.age}岁 · {introduction.givenBy.area}
              </p>
            </div>
            <p className="text-2xl text-gray-400">⇄</p>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold">{introduction.receivedBy.name}</p>
              <p className="text-sm text-gray-500">
                {introduction.receivedBy.gender} · {introduction.receivedBy.age}岁 · {introduction.receivedBy.area}
              </p>
            </div>
            {introduction.message && (
              <p className="text-sm text-gray-500 italic">"{introduction.message}"</p>
            )}
            <p className="text-xs text-gray-400">管理员: {introduction.admin.name}</p>
            <p className="text-sm text-gray-600">
              状态: {introduction.status === "pending" ? "待确认" : introduction.status === "accepted" ? "已通过" : "已拒绝"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

Build and verify:
```bash
npm run build
```
