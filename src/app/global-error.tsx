"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex items-center justify-center bg-muted px-4">
        <div className="max-w-md w-full bg-card rounded-xl shadow-sm border p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">应用发生错误</h1>
          <p className="text-sm text-muted-foreground">全局错误已捕获，请稍后重试。</p>
          <Button onClick={reset}>重试</Button>
        </div>
      </body>
    </html>
  );
}
