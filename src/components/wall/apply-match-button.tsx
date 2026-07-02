"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

/**
 * "申请牵线" button for the wall detail page. Mirrors the wall card's
 * apply behavior: POSTs to /api/match-requests and surfaces the result
 * via toast. `alreadyApplied` is determined server-side from a pending
 * match-request lookup so the button renders in the correct initial state.
 */
export function ApplyMatchButton({
  targetId,
  alreadyApplied,
}: {
  targetId: string;
  alreadyApplied: boolean;
}) {
  const [done, setDone] = useState(alreadyApplied);
  const [loading, setLoading] = useState(false);

  async function apply() {
    setLoading(true);
    try {
      const res = await fetch("/api/match-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId }),
      });
      if (res.ok) {
        setDone(true);
        toast.success("申请已提交，等待管理员审核");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "提交失败");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button className="w-full" size="lg" disabled={done || loading} onClick={apply}>
      <Heart className="w-4 h-4 mr-1" />
      {done ? "已提交申请，等待审核" : loading ? "提交中…" : "申请牵线"}
    </Button>
  );
}
