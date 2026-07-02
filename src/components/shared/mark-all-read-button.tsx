"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";

export function MarkAllReadButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { method: "POST" });
      if (res.ok) {
        toast.success("已全部标记为已读");
        router.refresh();
      } else {
        toast.error("操作失败");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={disabled || loading} onClick={markAll}>
      <CheckCheck className="w-4 h-4 mr-1" />
      全部已读
    </Button>
  );
}
