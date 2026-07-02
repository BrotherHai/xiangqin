"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResetUrl(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "请求失败");
        return;
      }
      setSubmitted(true);
      // In development the API returns the reset link directly (no email
      // service wired up). Production shows only the generic confirmation.
      if (data.resetUrl) setResetUrl(data.resetUrl);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">找回密码</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">输入注册邮箱，获取重置链接</p>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                若该邮箱已注册，重置链接已发送。请查收邮件并在 30 分钟内完成重置。
              </p>
              {resetUrl && (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-2">
                  <p className="text-xs text-yellow-700 font-medium">
                    邮件服务未配置（开发环境），重置链接如下：
                  </p>
                  <Link
                    href={resetUrl}
                    className="block break-all text-primary underline underline-offset-2 text-xs"
                  >
                    {resetUrl}
                  </Link>
                </div>
              )}
              <div className="text-center">
                <Link href="/login" className="text-primary hover:underline">返回登录</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "发送中…" : "发送重置链接"}
              </Button>
            </form>
          )}
          <p className="text-center text-sm text-muted-foreground mt-4">
            想起密码了？<Link href="/login" className="text-primary hover:underline">返回登录</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
