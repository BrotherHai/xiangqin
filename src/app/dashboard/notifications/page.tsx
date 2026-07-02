import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/shared/site-header";
import { NotificationBell } from "@/components/shared/notification-bell";
import { MarkAllReadButton } from "@/components/shared/mark-all-read-button";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatTime(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} 天前`;
  return d.toLocaleDateString("zh-CN");
}

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "user") redirect("/admin/dashboard");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="min-h-screen bg-muted">
      <SiteHeader>
        <NotificationBell />
        <span className="text-sm text-muted-foreground">{session.user.name}</span>
        <SignOutButton />
      </SiteHeader>
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">消息通知</h2>
          <MarkAllReadButton disabled={unreadCount === 0} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              全部通知 {unreadCount > 0 && (
                <span className="ml-2 text-xs font-normal text-destructive">{unreadCount} 条未读</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">暂无通知</p>
            ) : (
              <ul className="divide-y">
                {notifications.map((n) => {
                  const inner = (
                    <div className={`py-3 px-2 ${!n.readAt ? "bg-primary/5 -mx-2 rounded" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <p className={`text-sm ${!n.readAt ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                        {!n.readAt && <span className="mt-1.5 w-2 h-2 rounded-full bg-destructive shrink-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{formatTime(n.createdAt)}</p>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.link ? <Link href={n.link} className="block hover:bg-accent/40 rounded transition-colors">{inner}</Link> : inner}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">返回个人中心</Link>
        </div>
      </main>
    </div>
  );
}
