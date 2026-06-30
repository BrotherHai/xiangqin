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
