import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scoreEcrFromAnswers } from "@/lib/ecr";
import { computeCompatibility, type CompatibilityLevel } from "@/lib/compatibility";
import { SiteHeader } from "@/components/shared/site-header";
import { NotificationBell } from "@/components/shared/notification-bell";
import { PhotoGallery } from "@/components/shared/photo-gallery";
import { ApplyMatchButton } from "@/components/wall/apply-match-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function levelClass(level: CompatibilityLevel): string {
  if (level === "推荐") return "bg-emerald-500/10 text-emerald-600";
  if (level === "一般") return "bg-yellow-500/10 text-yellow-600";
  return "bg-red-500/10 text-red-600";
}

export default async function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session) redirect(`/login?callbackUrl=${encodeURIComponent("/profile/" + id)}`);
  if (session.user.role !== "user") redirect("/admin/dashboard");

  const me = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      age: true,
      area: true,
      expectMinAge: true,
      expectMaxAge: true,
      expectArea: true,
      testAnswers: { select: { score: true, question: { select: { sortOrder: true } } } },
      mbtiResult: { select: { type: true } },
    },
  });

  // Can't view your own profile on the wall — that's what the dashboard is for.
  if (me?.id === id) redirect("/dashboard");

  const profile = await prisma.profile.findUnique({
    where: { id, status: "approved" },
    select: {
      id: true,
      name: true,
      gender: true,
      age: true,
      area: true,
      occupation: true,
      photos: true,
      background: true,
      requirement: true,
      expectMinAge: true,
      expectMaxAge: true,
      expectArea: true,
      testAnswers: { select: { score: true, question: { select: { sortOrder: true } } } },
      mbtiResult: { select: { type: true } },
    },
  });

  if (!profile) notFound();

  const myEcr = me ? scoreEcrFromAnswers(me.testAnswers) : null;
  const myMbti = me?.mbtiResult?.type ?? null;
  const myTestsReady = !!myEcr && !!myMbti;

  const targetEcr = scoreEcrFromAnswers(profile.testAnswers);
  const targetMbti = profile.mbtiResult?.type ?? null;
  const compat = computeCompatibility({
    ecrA: myEcr?.dimensions ?? null,
    ecrB: targetEcr?.dimensions ?? null,
    mbtiA: myMbti,
    mbtiB: targetMbti,
    basicsA: me
      ? { age: me.age, area: me.area, expectMinAge: me.expectMinAge, expectMaxAge: me.expectMaxAge, expectArea: me.expectArea }
      : { age: null, area: null, expectMinAge: null, expectMaxAge: null, expectArea: null },
    basicsB: { age: profile.age, area: profile.area, expectMinAge: profile.expectMinAge, expectMaxAge: profile.expectMaxAge, expectArea: profile.expectArea },
  });

  // Has the current user already got a pending request to this target?
  const existingRequest = me
    ? await prisma.matchRequest.findFirst({
        where: { applicantId: me.id, targetId: id, status: "pending" },
        select: { id: true },
      })
    : null;
  const alreadyApplied = !!existingRequest;

  return (
    <div className="min-h-screen bg-muted">
      <SiteHeader>
        <NotificationBell />
        <Link href="/wall" className="text-sm text-muted-foreground hover:underline">返回相亲墙</Link>
      </SiteHeader>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="p-6 space-y-5">
            <PhotoGallery photosJson={profile.photos} name={profile.name} />

            <div className="space-y-1">
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <p className="text-sm text-muted-foreground">
                {profile.gender} · {profile.age}岁 · {profile.area}
              </p>
              <p className="text-sm text-muted-foreground">{profile.occupation}</p>
            </div>

            {myTestsReady && (
              <div className="flex items-center gap-2">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${levelClass(compat.level)}`}>
                  匹配度 {compat.total} · {compat.level}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              {targetEcr && (
                <div className="bg-muted/60 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">依恋风格</p>
                  <p className="font-medium">{targetEcr.result.emoji} {targetEcr.result.label}</p>
                </div>
              )}
              {targetMbti && (
                <div className="bg-muted/60 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">MBTI</p>
                  <p className="font-medium">{targetMbti}</p>
                </div>
              )}
            </div>

            {profile.background && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-1">个人介绍</h2>
                <p className="text-sm whitespace-pre-wrap">{profile.background}</p>
              </div>
            )}

            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-1">择偶期望</h2>
              {(profile.expectMinAge || profile.expectMaxAge || profile.expectArea) ? (
                <p className="text-sm">
                  {profile.expectMinAge || profile.expectMaxAge
                    ? `${profile.expectMinAge ?? "?"}–${profile.expectMaxAge ?? "?"} 岁`
                    : "年龄不限"}
                  {profile.expectArea ? ` · 期望地区：${profile.expectArea}` : " · 地区不限"}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">未设置硬性期望（不限）</p>
              )}
            </div>

            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-1">其他要求</h2>
              <p className="text-sm whitespace-pre-wrap">{profile.requirement}</p>
            </div>
          </CardContent>
        </Card>

        {myTestsReady && compat.detail.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">匹配分析</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{compat.summary}</p>
              <ul className="space-y-1.5">
                {compat.detail.map((d, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                <span>依恋分：{compat.ecrScore}</span>
                <span>MBTI 分：{compat.mbtiScore}</span>
                <span>硬性条件分：{compat.hardScore}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {!myTestsReady && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground/80">
            完成 <Link href="/dashboard" className="font-medium text-primary underline underline-offset-2">ECR 依恋测试与 MBTI 测试</Link> 后可查看与 TA 的匹配度。
          </div>
        )}

        <ApplyMatchButton targetId={profile.id} alreadyApplied={alreadyApplied} />

        {!me && (
          <p className="text-center text-sm text-muted-foreground">
            请先<Link href="/dashboard/profile" className="text-primary hover:underline">完善自己的资料</Link>并通过审核后申请牵线。
          </p>
        )}
      </main>
    </div>
  );
}
