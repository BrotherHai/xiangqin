"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Question {
  id: string;
  title: string;
  dimension: string;
  options: string;
}

interface EcrResultData {
  dimensions: { avoidance: number; anxiety: number };
  type: string;
  result: { label: string; emoji: string; tagline: string; desc: string };
}

export function TestForm({
  profileId,
  questions,
  hasAnswers,
}: {
  profileId: string;
  questions: Question[];
  hasAnswers: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [view, setView] = useState<"form" | "result">("form");
  const [result, setResult] = useState<EcrResultData | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadResult() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tests/result?profileId=${profileId}`);
      const data = await res.json();
      setResult(data.result);
      setView("result");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!hasAnswers) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tests/result?profileId=${profileId}`);
        const data = await res.json();
        if (!cancelled) {
          setResult(data.result);
          setView("result");
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [hasAnswers, profileId]);

  async function handleSubmit() {
    const answerList = Object.entries(answers).map(([questionId, score]) => ({
      questionId,
      score,
    }));
    setLoading(true);
    try {
      const res = await fetch(`/api/tests/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, answers: answerList }),
      });
      if (res.ok) {
        toast.success("测试提交成功");
        await loadResult();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "提交失败");
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading && !result) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">计算中…</CardContent>
      </Card>
    );
  }

  if (view === "result" && result) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <div className="text-6xl">{result.result.emoji}</div>
          <h2 className="text-2xl font-bold text-primary">{result.result.label}</h2>
          <p className="text-muted-foreground">{result.result.tagline}</p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">{result.result.desc}</p>
          <div className="flex justify-center gap-6 pt-2 text-sm">
            <span className="text-muted-foreground">回避 {result.dimensions.avoidance.toFixed(2)}</span>
            <span className="text-muted-foreground">焦虑 {result.dimensions.anxiety.toFixed(2)}</span>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => { setView("form"); setResult(null); }}>
              重新测试
            </Button>
            <Link href="/dashboard">
              <Button>返回个人中心</Button>
            </Link>
          </div>
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
              </p>
              <div className="space-y-2">
                {(options as { text: string; score: number }[]).map((opt) => (
                  <label
                    key={opt.score}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      answers[q.id] === opt.score ? "bg-primary/10 border-primary/40" : "hover:bg-muted"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id] === opt.score}
                      onChange={() => setAnswers({ ...answers, [q.id]: opt.score })}
                      className="accent-primary"
                    />
                    <span className="text-sm">{opt.text}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
      <Button onClick={handleSubmit} className="w-full" disabled={!allAnswered || loading}>
        {!allAnswered ? `请完成所有题目 (${Object.keys(answers).length}/${questions.length})` : "提交测试"}
      </Button>
    </div>
  );
}
