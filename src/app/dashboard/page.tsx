"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session.user as any).role !== "user") {
      router.push("/admin/dashboard");
    }
    if (status === "authenticated") {
      fetch("/api/user/profile").then(r => r.json()).then(setUserData);
    }
  }, [status, router, session]);

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  if (!userData) return null;

  const profile = userData.profile;
  const statusBadge = profile ? (
    profile.status === "approved" ? <Badge>已通过</Badge>
    : profile.status === "rejected" ? <Badge variant="destructive">已拒绝</Badge>
    : <Badge variant="secondary">待审核</Badge>
  ) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-pink-600">相亲平台</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{userData.name}</span>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>退出</Button>
        </div>
      </header>
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <h2 className="text-2xl font-bold">个人中心</h2>

        <Card>
          <CardHeader>
            <CardTitle>我的资料 {statusBadge}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile ? (
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">姓名：</span>{profile.name}</p>
                <p><span className="text-gray-500">性别：</span>{profile.gender}</p>
                <p><span className="text-gray-500">年龄：</span>{profile.age}岁</p>
                <p><span className="text-gray-500">地区：</span>{profile.area}</p>
                <p><span className="text-gray-500">职业：</span>{profile.occupation}</p>
                <p><span className="text-gray-500">状态：</span>{profile.status === "pending" ? "待审核" : profile.status === "approved" ? "已通过" : "已拒绝"}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">尚未填写征婚资料</p>
            )}
            <div className="flex gap-2">
              {profile ? (
                <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/profile")}>编辑资料</Button>
              ) : (
                <Button size="sm" onClick={() => router.push("/dashboard/profile")}>填写资料</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {profile && profile.status === "approved" && (
          <Card>
            <CardHeader>
              <CardTitle>性格测试</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-3">完成性格测试，帮助管理员更好地为你匹配</p>
              <Link href={`/test/${profile.id}`}>
                <Button>去做测试</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
