"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { computeCompatibility } from "@/lib/compatibility";
import { ProfileFilter, EMPTY_FILTER, type ProfileFilterValue } from "@/components/shared/profile-filter";

interface Profile {
  id: string;
  name: string;
  gender: string;
  age: number;
  area: string;
  occupation: string;
  requirement: string;
  background: string | null;
  expectMinAge: number | null;
  expectMaxAge: number | null;
  expectArea: string | null;
  ecr: { avoidance: number; anxiety: number; type: string | null } | null;
  mbti: string | null;
}

export function MatchView() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState<ProfileFilterValue>(EMPTY_FILTER);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  async function loadProfiles(current: ProfileFilterValue, pageNum: number) {
    const params = new URLSearchParams();
    if (current.gender) params.set("gender", current.gender);
    if (current.minAge) params.set("minAge", current.minAge);
    if (current.maxAge) params.set("maxAge", current.maxAge);
    if (current.area) params.set("area", current.area);
    params.set("page", String(pageNum));
    const res = await fetch(`/api/match?${params}`);
    const json = await res.json();
    setProfiles(json.data ?? []);
    setHasMore(!!json.hasMore);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/match?page=1`);
      const json = await res.json();
      if (!cancelled) {
        setProfiles(json.data ?? []);
        setHasMore(!!json.hasMore);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function search() {
    setPage(1);
    loadProfiles(filter, 1);
  }

  function go(delta: number) {
    const next = Math.max(1, page + delta);
    setPage(next);
    loadProfiles(filter, next);
  }

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.length === 2 && !prev.includes(id)
        ? [prev[1], id]
        : prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  const selectedProfiles = profiles.filter((p) => selected.includes(p.id));
  const compat =
    selectedProfiles.length === 2
      ? computeCompatibility({
          ecrA: selectedProfiles[0].ecr,
          ecrB: selectedProfiles[1].ecr,
          mbtiA: selectedProfiles[0].mbti,
          mbtiB: selectedProfiles[1].mbti,
          basicsA: {
            age: selectedProfiles[0].age,
            area: selectedProfiles[0].area,
            expectMinAge: selectedProfiles[0].expectMinAge,
            expectMaxAge: selectedProfiles[0].expectMaxAge,
            expectArea: selectedProfiles[0].expectArea,
          },
          basicsB: {
            age: selectedProfiles[1].age,
            area: selectedProfiles[1].area,
            expectMinAge: selectedProfiles[1].expectMinAge,
            expectMaxAge: selectedProfiles[1].expectMaxAge,
            expectArea: selectedProfiles[1].expectArea,
          },
        })
      : null;

  async function initiateIntroduction() {
    if (selected.length !== 2) {
      toast.warning("请选择两位征婚人");
      return;
    }
    const res = await fetch("/api/introductions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ givenById: selected[0], receivedById: selected[1] }),
    });
    if (res.ok) {
      toast.success("牵线已发起！");
      setSelected([]);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || "发起失败");
    }
  }

  return (
    <div className="space-y-6">
      <ProfileFilter value={filter} onChange={setFilter} onSearch={search} />

      {compat && (
        <Card className={`border-2 ${compat.level === "推荐" ? "border-green-300 bg-green-50/40" : compat.level === "一般" ? "border-yellow-300 bg-yellow-50/40" : "border-red-300 bg-red-50/40"}`}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold">兼容度评估</h3>
              <span className="text-2xl font-bold">{compat.total} 分</span>
              <Badge className={
                compat.level === "推荐" ? "bg-green-600" : compat.level === "一般" ? "bg-yellow-500" : "bg-red-500"
              }>{compat.level}</Badge>
              <span className="text-xs text-muted-foreground">ECR {compat.ecrScore} · MBTI {compat.mbtiScore} · 硬性 {compat.hardScore}</span>
            </div>
            <p className="text-sm text-foreground/80">{compat.summary}</p>
            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
              {compat.detail.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">已选择 {selected.length} 人（需选2人发起牵线）</p>
        <Button onClick={initiateIntroduction} disabled={selected.length !== 2}>发起牵线</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((p) => {
          const isSelected = selected.includes(p.id);
          return (
            <Card
              key={p.id}
              className={`cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary" : "hover:shadow-md"}`}
              onClick={() => toggleSelect(p.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{p.gender} · {p.age}岁 · {p.area}</p>
                  </div>
                  {isSelected && <Badge>已选</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{p.occupation}</p>
                {(p.ecr || p.mbti) && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {p.ecr && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                        依恋 {p.ecr.type ?? "?"}
                      </span>
                    )}
                    {p.mbti && (
                      <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">
                        MBTI {p.mbti}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {profiles.length === 0 && (
        <p className="text-center text-muted-foreground py-8">暂无符合条件的资料</p>
      )}
      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => go(-1)}>上一页</Button>
        <span className="text-sm text-muted-foreground">第 {page} 页</span>
        <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => go(1)}>下一页</Button>
      </div>
    </div>
  );
}
