"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "待确认", variant: "secondary" },
  accepted: { label: "已通过", variant: "default" },
  rejected: { label: "已拒绝", variant: "destructive" },
};

export function IntroductionsList({ introductions }: { introductions: any[] }) {
  const router = useRouter();

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/introductions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {introductions.map((item) => {
        const status = statusMap[item.status] || statusMap.pending;
        return (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {item.givenBy.name} ({item.givenBy.gender}, {item.givenBy.age})
                    <span className="mx-2 text-gray-400">⇄</span>
                    {item.receivedBy.name} ({item.receivedBy.gender}, {item.receivedBy.age})
                  </p>
                  {item.message && (
                    <p className="text-sm text-gray-500 mt-1">推荐语: {item.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">管理员: {item.admin.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  {item.status === "pending" && (
                    <>
                      <Button size="sm" className="bg-green-600" onClick={() => updateStatus(item.id, "accepted")}>通过</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(item.id, "rejected")}>拒绝</Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {introductions.length === 0 && (
        <p className="text-center text-gray-400 py-8">暂无牵线记录</p>
      )}
    </div>
  );
}
