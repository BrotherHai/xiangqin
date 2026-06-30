### Task 7: Matching System

**Files:**
- Create: `src/app/api/match/route.ts`
- Create: `src/app/admin/match/page.tsx`
- Create: `src/components/admin/match-view.tsx`

Step 1: Create match API

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
    include: { testAnswers: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(profiles);
}
```

Step 2: Create match page

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
              className={`cursor-pointer transition-all ${isSelected ? "ring-2 ring-pink-500" : "hover:shadow-md"}`}
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
  return [{ dimension: "综合", avgScore: answers.reduce((s, a) => s + a.score, 0) / answers.length }];
}
```

Build and verify:
```bash
npm run build
```
