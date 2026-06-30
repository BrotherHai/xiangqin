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
