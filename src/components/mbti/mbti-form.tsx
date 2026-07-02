"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mbtiQuestions } from "@/lib/mbti";

interface MbtiScore {
  pair: string;
  values: Record<string, number>;
}

interface MbtiContent {
  type: string;
  subtitle: string;
  description: string;
  contentHtml: string;
}

interface MbtiResultData {
  type: string;
  scores: MbtiScore[];
  createdAt?: string;
}

export function MbtiForm({
  profileId,
  hasResult,
}: {
  profileId: string;
  hasResult: boolean;
}) {
  const [answers, setAnswers] = useState<Record<number, "a" | "b">>({});
  const [view, setView] = useState<"form" | "result">("form");
  const [result, setResult] = useState<MbtiResultData | null>(null);
  const [content, setContent] = useState<MbtiContent | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasResult) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tests/mbti?profileId=${profileId}`);
        const data = await res.json();
        if (!cancelled && data.result) {
          setResult(data.result);
          setContent(data.content);
          setView("result");
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [hasResult, profileId]);

  async function handleSubmit() {
    const letters = mbtiQuestions.map((_, idx) => {
      const choice = answers[idx];
      if (choice === "b") return mbtiQuestions[idx].choice_b.value;
      return mbtiQuestions[idx].choice_a.value;
    });
    setLoading(true);
    try {
      const res = await fetch("/api/tests/mbti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, answers: letters }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ...data.result, scores: data.scores });
        setContent(data.content);
        setView("result");
        toast.success("MBTI 测试提交成功");
      } else {
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

  if (view === "result" && result && content) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <h2 className="text-3xl font-bold text-primary">{result.type}</h2>
            <p className="text-muted-foreground">{content.subtitle}</p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">{content.description}</p>
            <div className="flex justify-center gap-4 pt-2 text-sm text-muted-foreground">
              {result.scores.map((s) => (
                <span key={s.pair}>
                  {s.pair}: {Object.entries(s.values).map(([k, v]) => `${k}${v}`).join(" / ")}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div
              className="prose prose-sm max-w-none text-foreground/80"
              dangerouslySetInnerHTML={{ __html: content.contentHtml }}
            />
          </CardContent>
        </Card>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => { setView("form"); setResult(null); }}>
            重新测试
          </Button>
          <Link href="/dashboard">
            <Button>返回个人中心</Button>
          </Link>
        </div>
      </div>
    );
  }

  const allAnswered = mbtiQuestions.every((_, idx) => answers[idx] !== undefined);

  return (
    <div className="space-y-4">
      {mbtiQuestions.map((q, idx) => (
        <Card key={idx}>
          <CardContent className="p-4">
            <p className="font-medium mb-3">{idx + 1}. {q.question}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(["a", "b"] as const).map((key) => {
                const opt = key === "a" ? q.choice_a : q.choice_b;
                return (
                  <label
                    key={key}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      answers[idx] === key ? "bg-primary/10 border-primary/40" : "hover:bg-muted"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${idx}`}
                      checked={answers[idx] === key}
                      onChange={() => setAnswers({ ...answers, [idx]: key })}
                      className="accent-primary"
                    />
                    <span className="text-sm">{opt.text}</span>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
      <Button onClick={handleSubmit} className="w-full" disabled={!allAnswered || loading}>
        {!allAnswered ? `请完成所有题目 (${Object.keys(answers).length}/${mbtiQuestions.length})` : "提交测试"}
      </Button>
    </div>
  );
}
