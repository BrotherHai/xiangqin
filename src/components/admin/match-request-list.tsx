"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MatchRequestListItem } from "@/lib/types";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "待审核", variant: "secondary" },
  approved: { label: "已通过", variant: "default" },
  rejected: { label: "已拒绝", variant: "destructive" },
};

function info(p: { name: string; gender: string; age: number; area: string }) {
  return `${p.name} (${p.gender}, ${p.age}, ${p.area})`;
}

export function MatchRequestList({ requests }: { requests: MatchRequestListItem[] }) {
  const router = useRouter();

  async function handle(id: string, status: string) {
    await fetch(`/api/match-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {requests.map((r) => {
        const s = statusMap[r.status] || statusMap.pending;
        return (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {info(r.applicant)}
                    <span className="mx-2 text-muted-foreground">想认识</span>
                    {info(r.target)}
                  </p>
                  {r.message && <p className="text-sm text-muted-foreground mt-1">留言：{r.message}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={s.variant}>{s.label}</Badge>
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-600/90" onClick={() => handle(r.id, "approved")}>通过</Button>
                      <Button size="sm" variant="destructive" onClick={() => handle(r.id, "rejected")}>拒绝</Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {requests.length === 0 && (
        <p className="text-center text-muted-foreground py-8">暂无牵线申请</p>
      )}
    </div>
  );
}
