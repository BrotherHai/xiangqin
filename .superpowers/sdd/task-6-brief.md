### Task 6: Personality Test System

**Files:**
- Create: `src/app/api/tests/route.ts`
- Create: `src/app/api/tests/[id]/route.ts`
- Create: `src/app/api/tests/submit/route.ts`
- Create: `src/app/admin/tests/page.tsx`
- Create: `src/components/admin/test-question-list.tsx`
- Create: `src/components/admin/test-question-form.tsx`
- Create: `src/app/test/[profileId]/page.tsx`
- Create: `src/app/test/[profileId]/test-form.tsx`

Step 1: Create test questions API

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

Step 2: Create single question API

`src/app/api/tests/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const question = await prisma.testQuestion.update({
    where: { id },
    data: {
      title: body.title,
      dimension: body.dimension,
      options: JSON.stringify(body.options),
      sortOrder: body.sortOrder,
    },
  });
  return NextResponse.json(question);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.testQuestion.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

Step 3: Create submit answer API

`src/app/api/tests/submit/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { profileId, answers } = await req.json();

  await prisma.testAnswer.deleteMany({ where: { profileId } });

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

Step 4: Create admin test management page

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

Step 5: Create public test answering page

`src/app/test/[profileId]/page.tsx`:
```typescript
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TestForm } from "./test-form";

export default async function TestPage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await params;
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
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
        <TestForm profileId={profileId} questions={questions} />
      </div>
    </div>
  );
}
```

`src/app/test/[profileId]/test-form.tsx`:
```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Question {
  id: string;
  title: string;
  dimension: string;
  options: string;
}

export function TestForm({ profileId, questions }: { profileId: string; questions: Question[] }) {
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

Step 6: Build and verify

```bash
npm run build
```
