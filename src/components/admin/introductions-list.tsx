"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { IntroductionListItem } from "@/lib/types";

const sideLabel: Record<string, string> = {
  pending: "待确认",
  accepted: "已同意",
  rejected: "已拒绝",
};

const overallLabel: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "进行中", variant: "secondary" },
  exchanged: { label: "已交换", variant: "default" },
  rejected: { label: "已拒绝", variant: "destructive" },
};

export function IntroductionsList({ introductions }: { introductions: IntroductionListItem[] }) {
  const router = useRouter();

  async function setSide(id: string, side: "givenByStatus" | "receivedByStatus", value: string) {
    await fetch(`/api/introductions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [side]: value }),
    });
    router.refresh();
  }

  function SideRow({
    name,
    info,
    contact,
    sideStatus,
    side,
    introId,
    exchanged,
  }: {
    name: string;
    info: string;
    contact: { wechat: string | null; phone: string | null };
    sideStatus: string;
    side: "givenByStatus" | "receivedByStatus";
    introId: string;
    exchanged: boolean;
  }) {
    return (
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-medium">{name} <span className="text-muted-foreground text-xs">({info})</span></p>
          {exchanged && (contact.wechat || contact.phone) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {contact.wechat && <span className="mr-3">微信: {contact.wechat}</span>}
              {contact.phone && <span>电话: {contact.phone}</span>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={sideStatus === "accepted" ? "default" : sideStatus === "rejected" ? "destructive" : "secondary"}>
            {sideLabel[sideStatus] || sideStatus}
          </Badge>
          {sideStatus === "pending" && (
            <>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-600/90 h-7" onClick={() => setSide(introId, side, "accepted")}>同意</Button>
              <Button size="sm" variant="destructive" className="h-7" onClick={() => setSide(introId, side, "rejected")}>拒绝</Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {introductions.map((item) => {
        const overall = overallLabel[item.status] || overallLabel.pending;
        const exchanged = item.status === "exchanged";
        return (
          <Card key={item.id}>
            <CardContent className="p-4 space-y-3">
              <SideRow
                name={item.givenBy.name}
                info={`${item.givenBy.gender}, ${item.givenBy.age}`}
                contact={{ wechat: item.givenBy.wechat, phone: item.givenBy.phone }}
                sideStatus={item.givenByStatus}
                side="givenByStatus"
                introId={item.id}
                exchanged={exchanged}
              />
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">⇄</p>
                <Badge variant={overall.variant}>{overall.label}</Badge>
              </div>
              <SideRow
                name={item.receivedBy.name}
                info={`${item.receivedBy.gender}, ${item.receivedBy.age}`}
                contact={{ wechat: item.receivedBy.wechat, phone: item.receivedBy.phone }}
                sideStatus={item.receivedByStatus}
                side="receivedByStatus"
                introId={item.id}
                exchanged={exchanged}
              />
              {item.message && (
                <p className="text-sm text-muted-foreground pt-1 border-t">推荐语: {item.message}</p>
              )}
              <p className="text-xs text-muted-foreground">管理员: {item.admin.name}</p>
            </CardContent>
          </Card>
        );
      })}
      {introductions.length === 0 && (
        <p className="text-center text-muted-foreground py-8">暂无牵线记录</p>
      )}
    </div>
  );
}
