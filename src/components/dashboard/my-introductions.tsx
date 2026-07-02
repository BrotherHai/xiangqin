"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IntroItem } from "@/lib/dashboard-data";

const sideLabel = (s: string) =>
  s === "accepted" ? "已同意" : s === "rejected" ? "已拒绝" : "待确认";

export function MyIntroductions({ initialIntros }: { initialIntros: IntroItem[] }) {
  const [intros, setIntros] = useState<IntroItem[]>(initialIntros);
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (intros.length === 0) return null;

  async function respond(id: string, decision: string) {
    setPendingId(id);
    try {
      const res = await fetch(`/api/introductions/${id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) {
        const data = await fetch("/api/user/introductions").then((r) => r.json());
        setIntros(data);
        toast.success(decision === "accepted" ? "已同意牵线" : "已拒绝牵线");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "操作失败");
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>我的牵线</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {intros.map((it) => {
          const o = it.other;
          return (
            <div key={it.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{o.name}</p>
                  <p className="text-sm text-muted-foreground">{o.gender} · {o.age}岁 · {o.area}</p>
                  <p className="text-xs text-muted-foreground">{o.occupation}</p>
                </div>
                <Badge variant={it.status === "exchanged" ? "default" : it.status === "rejected" ? "destructive" : "secondary"}>
                  {it.status === "exchanged" ? "已交换" : it.status === "rejected" ? "已拒绝" : "进行中"}
                </Badge>
              </div>
              {it.status === "exchanged" && (o.wechat || o.phone) && (
                <div className="bg-emerald-500/10 rounded p-2 text-sm">
                  <p className="font-medium text-emerald-600 mb-1">已交换联系方式</p>
                  {o.wechat && <p>微信：{o.wechat}</p>}
                  {o.phone && <p>电话：{o.phone}</p>}
                </div>
              )}
              {it.status === "rejected" && (
                <p className="text-sm text-muted-foreground">本次牵线未成功</p>
              )}
              {it.status === "pending" && (
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">我方：{sideLabel(it.mySide)} · 对方：{sideLabel(it.otherSide)}</p>
                  {it.mySide === "pending" ? (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-600/90"
                        disabled={pendingId === it.id}
                        onClick={() => respond(it.id, "accepted")}
                      >
                        同意
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={pendingId === it.id}
                        onClick={() => respond(it.id, "rejected")}
                      >
                        拒绝
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">等待对方确认</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
