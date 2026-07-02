"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TestQuestionForm } from "./test-question-form";
import type { TestQuestion, TestQuestionInput, TestQuestionOption } from "@/lib/types";

export function TestQuestionList({ questions: initial }: { questions: TestQuestion[] }) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initial);
  const [editing, setEditing] = useState<TestQuestion | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm("确定删除这道题？")) return;
    await fetch(`/api/tests/${id}`, { method: "DELETE" });
    setQuestions(questions.filter((q) => q.id !== id));
    router.refresh();
  }

  async function handleSave(data: TestQuestionInput, id?: string) {
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
        <DialogTrigger render={<Button onClick={() => setEditing(null)}>新增题目</Button>} />
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
        const options: TestQuestionOption[] = JSON.parse(q.options || "[]");
        return (
          <Card key={q.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium">{q.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">维度: {q.dimension}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {options.map((o, i: number) => (
                      <span key={i} className="text-xs bg-muted px-2 py-1 rounded">{o.text} ({o.score}分)</span>
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
      {questions.length === 0 && <p className="text-center text-muted-foreground py-8">暂无题目</p>}
    </div>
  );
}
