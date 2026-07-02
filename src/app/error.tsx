"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="max-w-md w-full bg-card rounded-xl shadow-sm border p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">出错了</h1>
        <p className="text-sm text-muted-foreground">页面加载时发生异常，请稍后重试。</p>
        <Button onClick={reset}>重试</Button>
      </div>
    </div>
  );
}
