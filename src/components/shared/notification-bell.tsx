"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

/**
 * Header bell that polls the unread-notification count and shows a badge.
 * Polls every 60s — cheap for this single-instance SQLite deployment.
 * Hidden entirely for unauthenticated visitors (the endpoint returns 401
 * and we just render nothing).
 */
export function NotificationBell() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setCount(typeof json.count === "number" ? json.count : 0);
      } catch {
        /* ignore — badge is non-critical */
      }
    }

    refresh();
    const timer = setInterval(refresh, 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (!count) return null;

  return (
    <Link
      href="/dashboard/notifications"
      className="relative inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      aria-label={`通知（${count} 条未读）`}
    >
      <Bell className="w-5 h-5" />
      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center">
        {count > 99 ? "99+" : count}
      </span>
    </Link>
  );
}
