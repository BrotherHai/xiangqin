import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { Heart, ShieldCheck, Brain, ChevronRight } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getDashboardData, getUserIntroductions } from "@/lib/dashboard-data";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { MyIntroductions } from "@/components/dashboard/my-introductions";
import { ProfileHero } from "@/components/dashboard/profile-hero";
import { ProfileProgress } from "@/components/dashboard/profile-progress";
import { SiteHeader } from "@/components/shared/site-header";
import { NotificationBell } from "@/components/shared/notification-bell";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "user") redirect("/admin/dashboard");

  const [data, intros] = await Promise.all([
    getDashboardData(session.user.id),
    getUserIntroductions(session.user.id),
  ]);

  const profile = data?.profile ?? null;
  const ecr = data?.ecr ?? null;
  const mbti = data?.mbti ?? null;
  const userName = data?.name ?? "";

  const approved = profile?.status === "approved";
  const ecrInfo = ecr ? { emoji: ecr.result.emoji, label: ecr.result.label } : null;
  const mbtiType = mbti?.type ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent/50 to-muted">
      <SiteHeader>
        <NotificationBell />
        <span className="text-sm text-muted-foreground">{userName}</span>
        <SignOutButton />
      </SiteHeader>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        <h2 className="text-2xl font-bold">个人中心</h2>

        <ProfileHero
          userName={userName}
          profile={profile}
          ecr={ecrInfo}
          mbtiType={mbtiType}
        />

        <ProfileProgress
          hasProfile={!!profile}
          approved={approved}
          hasEcr={!!ecr}
          hasMbti={!!mbti}
        />

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ActionCard
            href="/wall"
            icon={<Heart className="size-5" />}
            title="相亲墙"
            description="浏览其他征婚人，遇到心动的可以申请牵线"
            cta="逛相亲墙"
            accent="rose"
            className="sm:col-span-2"
          />
          {profile && approved && (
            <ActionCard
              href={`/test/${profile.id}`}
              icon={<ShieldCheck className="size-5" />}
              title="依恋风格测试"
              description="完成测试，帮助管理员更好地为你匹配"
              cta={ecr ? "重新测试" : "去做测试"}
              accent="sky"
            />
          )}
          {profile && approved && (
            <ActionCard
              href={`/mbti/${profile.id}`}
              icon={<Brain className="size-5" />}
              title="MBTI 性格测试"
              description="了解自己的 MBTI 性格类型"
              cta={mbti ? "重新测试" : "去做测试"}
              accent="violet"
            />
          )}
        </div>

        {profile && profile.status === "rejected" && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            资料未通过审核，请修改后重新提交。
          </div>
        )}

        <MyIntroductions initialIntros={intros} />
      </main>
    </div>
  );
}

type AccentTone = "rose" | "sky" | "violet";

function ActionCard({
  href,
  icon,
  title,
  description,
  cta,
  accent,
  className,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  cta: string;
  accent: AccentTone;
  className?: string;
}) {
  const accentClass: Record<AccentTone, string> = {
    rose: "bg-rose-500/10 text-rose-600",
    sky: "bg-sky-500/10 text-sky-600",
    violet: "bg-violet-500/10 text-violet-600",
  };

  return (
    <Link href={href} className={cn("group block", className)}>
      <Card className="hover:ring-primary/30 hover:shadow-md transition-all h-full">
        <CardContent className="p-5 flex items-center gap-4 h-full">
          <div
            className={cn(
              "size-11 rounded-xl flex items-center justify-center shrink-0",
              accentClass[accent],
            )}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{title}</h3>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            <span className="text-xs font-medium text-primary mt-1.5 inline-block">
              {cta} →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
