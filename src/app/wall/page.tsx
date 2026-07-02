import Link from "next/link";
import { WallView } from "@/components/wall/wall-view";
import { SiteHeader } from "@/components/shared/site-header";
import { NotificationBell } from "@/components/shared/notification-bell";

export default function WallPage() {
  return (
    <div className="min-h-screen bg-muted">
      <SiteHeader>
        <NotificationBell />
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">返回个人中心</Link>
      </SiteHeader>
      <main className="max-w-5xl mx-auto p-6">
        <WallView />
      </main>
    </div>
  );
}
