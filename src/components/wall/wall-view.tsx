"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileFilter, EMPTY_FILTER, type ProfileFilterValue } from "@/components/shared/profile-filter";

type CompatibilityLevel = "推荐" | "一般" | "谨慎";

interface WallProfile {
  id: string;
  name: string;
  gender: string;
  age: number;
  area: string;
  occupation: string;
  photos: string;
  requirement: string;
  background: string | null;
  attachment: { type: string; label: string; emoji: string } | null;
  mbti: string | null;
  compatibility: { total: number; level: CompatibilityLevel } | null;
}

function firstPhoto(photos: string): string | null {
  try {
    const arr = JSON.parse(photos || "[]");
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
  } catch {
    return null;
  }
}

function levelClass(level: CompatibilityLevel): string {
  if (level === "推荐") return "bg-emerald-500/10 text-emerald-600";
  if (level === "一般") return "bg-yellow-500/10 text-yellow-600";
  return "bg-red-500/10 text-red-600";
}

function buildParams(filter: ProfileFilterValue, page: number) {
  const params = new URLSearchParams();
  // Gender is enforced server-side (opposite-gender only), so the client
  // never sends it.
  if (filter.minAge) params.set("minAge", filter.minAge);
  if (filter.maxAge) params.set("maxAge", filter.maxAge);
  if (filter.area) params.set("area", filter.area);
  if (filter.sort === "compatibility") params.set("sort", "compatibility");
  params.set("page", String(page));
  return params;
}

export function WallView() {
  const [profiles, setProfiles] = useState<WallProfile[]>([]);
  const [filter, setFilter] = useState<ProfileFilterValue>(EMPTY_FILTER);
  const [applied, setApplied] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myTestsReady, setMyTestsReady] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadPage = useCallback(async (filterVal: ProfileFilterValue, pageNum: number, append: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wall?${buildParams(filterVal, pageNum)}`);
      const json = await res.json();
      const next: WallProfile[] = json.data ?? [];
      setHasMore(!!json.hasMore);
      setMyTestsReady(json.myTestsReady !== false);
      setNeedsProfile(!!json.needsProfile);
      setProfiles((prev) => (append ? [...prev, ...next] : next));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/wall?${buildParams(filter, 1)}`);
      const json = await res.json();
      if (!cancelled) {
        setProfiles(json.data ?? []);
        setHasMore(!!json.hasMore);
        setMyTestsReady(json.myTestsReady !== false);
        setNeedsProfile(!!json.needsProfile);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sort changes are driven by the user clicking the toggle (an event, not an
  // effect), so we reset to page 1 and reload from the handler directly —
  // no setState-in-effect cascading render.
  function changeSort(sort: "newest" | "compatibility") {
    const next = { ...filter, sort };
    setFilter(next);
    setPage(1);
    loadPage(next, 1, false);
  }

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        const next = page + 1;
        setPage(next);
        loadPage(filter, next, true);
      }
    }, { rootMargin: "200px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, page, filter, loadPage]);

  function search() {
    setPage(1);
    loadPage(filter, 1, false);
  }

  async function apply(targetId: string) {
    const res = await fetch("/api/match-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId }),
    });
    if (res.ok) {
      setApplied((prev) => ({ ...prev, [targetId]: "已提交申请，等待审核" }));
      toast.success("申请已提交，等待管理员审核");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "提交失败");
    }
  }

  if (needsProfile) {
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-6 py-12 text-center space-y-3">
        <p className="text-sm text-foreground/80">
          请先完善自己的资料，相亲墙将为你展示异性征婚人。
        </p>
        <Link href="/dashboard/profile">
          <Button>填写资料</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProfileFilter value={filter} onChange={setFilter} onSearch={search} showGender={false} showSort onSortChange={changeSort} />

      {!myTestsReady && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground/80">
          完成 <Link href="/dashboard" className="font-medium text-primary underline underline-offset-2">ECR 依恋测试与 MBTI 测试</Link> 后即可查看与他人的匹配度。
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((p) => {
          const photo = firstPhoto(p.photos);
          const note = applied[p.id];
          return (
            <Card key={p.id} className="relative">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start gap-3">
                  {photo ? (
                    <Image
                      src={photo}
                      alt={p.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-lg object-cover bg-muted"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-muted-foreground/50 text-xs">无照片</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">
                      <Link
                        href={`/profile/${p.id}`}
                        className="after:absolute after:inset-0 hover:text-primary transition-colors"
                      >
                        {p.name}
                      </Link>
                    </h3>
                    <p className="text-sm text-muted-foreground">{p.gender} · {p.age}岁 · {p.area}</p>
                    <p className="text-sm text-muted-foreground">{p.occupation}</p>
                  </div>
                  {p.compatibility && (
                    <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${levelClass(p.compatibility.level)}`}>
                      匹配 {p.compatibility.total}
                      <span className="hidden sm:inline"> · {p.compatibility.level}</span>
                    </span>
                  )}
                </div>
                {p.background && <p className="text-xs text-muted-foreground line-clamp-2">{p.background}</p>}
                <p className="text-xs text-muted-foreground"><span className="text-muted-foreground/70">择偶要求：</span>{p.requirement}</p>
                {p.attachment && (
                  <p className="text-xs"><span className="text-muted-foreground/70">依恋风格：</span>{p.attachment.emoji} {p.attachment.label}</p>
                )}
                {p.mbti && (
                  <p className="text-xs"><span className="text-muted-foreground/70">MBTI：</span>{p.mbti}</p>
                )}
                <Button
                  size="sm"
                  className="w-full relative z-10"
                  variant={note ? "secondary" : "default"}
                  disabled={!!note}
                  onClick={() => apply(p.id)}
                >
                  {note || "申请牵线"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {profiles.length === 0 && !loading && (
        <p className="text-center text-muted-foreground py-8">暂无符合条件的资料</p>
      )}
      <div ref={sentinelRef} className="h-1" />
      {loading && profiles.length > 0 && (
        <p className="text-center text-muted-foreground py-4 text-sm">加载更多…</p>
      )}
    </div>
  );
}
