### Task 5: Profile Management

**Files:**
- Create: `src/app/api/profiles/route.ts`
- Create: `src/app/api/profiles/[id]/route.ts`
- Create: `src/app/api/profiles/[id]/status/route.ts`
- Create: `src/app/admin/profiles/page.tsx`
- Create: `src/app/admin/profiles/create/page.tsx`
- Create: `src/app/admin/profiles/[id]/page.tsx`
- Create: `src/app/admin/profiles/[id]/edit/page.tsx`
- Create: `src/components/admin/profile-form.tsx`
- Create: `src/components/admin/profile-card.tsx`
- Create: `src/components/admin/profile-detail.tsx`

Step 1: Create profiles API (list + create)

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

Step 2: Create single profile API

`src/app/api/profiles/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await prisma.profile.findUnique({
    where: { id },
    include: { testAnswers: { include: { question: true } } },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(profile);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const profile = await prisma.profile.update({
    where: { id },
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

Step 3: Create status update API

`src/app/api/profiles/[id]/status/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json();
  if (!["pending", "approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const profile = await prisma.profile.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json(profile);
}
```

Step 4: Create profile form component

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
        photos: form.photos.split(",").map((s: string) => s.trim()).filter(Boolean),
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

Step 5: Create profile list page

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

Step 6: Create profile card component

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

Step 7: Create profile detail page

`src/app/admin/profiles/[id]/page.tsx`:
```typescript
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProfileDetail } from "@/components/admin/profile-detail";

export default async function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await prisma.profile.findUnique({
    where: { id },
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

Step 8: Create profile create page

`src/app/admin/profiles/create/page.tsx`:
```typescript
import { ProfileForm } from "@/components/admin/profile-form";

export default function CreateProfilePage() {
  return <ProfileForm />;
}
```

Step 9: Create profile edit page

`src/app/admin/profiles/[id]/edit/page.tsx`:
```typescript
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProfileForm } from "@/components/admin/profile-form";

export default async function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await prisma.profile.findUnique({ where: { id } });
  if (!profile) notFound();
  return <ProfileForm initialData={profile} profileId={profile.id} />;
}
```

Step 10: Build and verify

```bash
npm run build
```

Expected: Clean build. Visit /admin/profiles after login to see the list. Create a new profile, verify it appears.
