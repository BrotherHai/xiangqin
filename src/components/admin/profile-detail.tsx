"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProfileDetailProps, MbtiScorePair } from "@/lib/types";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "待审核", variant: "secondary" },
  approved: { label: "已通过", variant: "default" },
  rejected: { label: "已拒绝", variant: "destructive" },
};

export function ProfileDetail({ profile, ecr, mbti }: ProfileDetailProps) {
  const router = useRouter();
  const status = statusMap[profile.status] || statusMap.pending;
  const photos: string[] = JSON.parse(profile.photos || "[]");

  async function updateStatus(status: string) {
    await fetch(`/api/profiles/${profile.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">资料详情</h2>
        <div className="flex gap-2">
          {profile.status === "pending" && (
            <>
              <Button onClick={() => updateStatus("approved")} className="bg-emerald-600 hover:bg-emerald-600/90">通过</Button>
              <Button onClick={() => updateStatus("rejected")} variant="destructive">拒绝</Button>
            </>
          )}
          <Button variant="outline" onClick={() => router.push(`/admin/profiles/${profile.id}/edit`)}>编辑</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {profile.name}
              <Badge variant={status.variant}>{status.label}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="性别" value={profile.gender} />
            <InfoRow label="年龄" value={`${profile.age}岁`} />
            <InfoRow label="地区" value={profile.area} />
            <InfoRow label="职业" value={profile.occupation} />
            <InfoRow label="微信号" value={profile.wechat || "未填写"} />
            <InfoRow label="手机号" value={profile.phone || "未填写"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>详细介绍</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">基本情况</p>
              <p className="text-sm">{profile.background || "未填写"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">择偶要求</p>
              <p className="text-sm">{profile.requirement}</p>
            </div>
            {photos.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">照片</p>
                <div className="flex gap-2 flex-wrap">
                  {photos.map((url: string, i: number) => (
                    <Image key={i} src={url} alt={`photo-${i}`} width={96} height={96} className="w-24 h-24 object-cover rounded-lg" />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {ecr && (
          <Card className="lg:col-span-2 bg-primary/5">
            <CardHeader>
              <CardTitle>依恋风格</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{ecr.result.emoji}</span>
                <div>
                  <p className="text-lg font-semibold text-primary">{ecr.result.label}</p>
                  <p className="text-sm text-muted-foreground">{ecr.result.tagline}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{ecr.result.desc}</p>
              <div className="flex gap-6 pt-1 text-sm text-muted-foreground">
                <span>回避 {ecr.dimensions.avoidance.toFixed(2)}</span>
                <span>焦虑 {ecr.dimensions.anxiety.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {mbti && (
          <Card className="lg:col-span-2 bg-blue-500/5">
            <CardHeader>
              <CardTitle>MBTI 性格类型</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-bold text-blue-600">{mbti.type}</p>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {Array.isArray(JSON.parse(mbti.scores || "[]")) && (JSON.parse(mbti.scores) as MbtiScorePair[]).map((s) => (
                  <span key={s.pair}>
                    {s.pair}: {Object.entries(s.values).map(([k, v]) => `${k}${v}`).join(" / ")}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {profile.testAnswers?.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>性格测试结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profile.testAnswers.map((a) => (
                  <div key={a.id} className="flex justify-between text-sm py-1 border-b">
                    <span>{a.question.title}</span>
                    <span className="text-muted-foreground">{a.question.dimension}: {a.score}分</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
