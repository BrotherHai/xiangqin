"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TestQuestionInput, TestQuestionOption } from "@/lib/types";

interface InitialData {
  title?: string;
  dimension?: string;
  options?: string;
  sortOrder?: number;
}

export function TestQuestionForm({ initialData, onSave }: { initialData?: InitialData | null; onSave: (data: TestQuestionInput) => void }) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [dimension, setDimension] = useState(initialData?.dimension || "");
  const [options, setOptions] = useState<TestQuestionOption[]>(
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
        <Label>维度标签（ECR-36 使用“回避”或“焦虑”，与评分一致才能正确计分）</Label>
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
