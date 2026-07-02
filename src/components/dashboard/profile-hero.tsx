import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Briefcase, MapPin, Heart, Sparkles, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Profile data shown in the dashboard hero. Mirrors the subset of the Prisma
 * profile record that the dashboard already loads — `photos` is the raw JSON
 * string stored in the DB and is parsed here for the photo wall.
 */
export interface ProfileHeroData {
  name: string;
  gender: string;
  age: number;
  area: string;
  occupation: string;
  status: string;
  photos: string;
}

/** Maximum number of photos shown in the wall, matching the uploader cap. */
const MAX_WALL_PHOTOS = 6;

function parsePhotos(photosJson: string): string[] {
  try {
    const arr = JSON.parse(photosJson || "[]");
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((s): s is string => typeof s === "string")
      .slice(0, MAX_WALL_PHOTOS);
  } catch {
    return [];
  }
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge>已通过</Badge>;
  if (status === "rejected") return <Badge variant="destructive">已拒绝</Badge>;
  return <Badge variant="secondary">待审核</Badge>;
}

type ChipTone = "default" | "primary" | "violet";

function Chip({
  icon,
  children,
  tone = "default",
}: {
  icon: ReactNode;
  children: ReactNode;
  tone?: ChipTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        tone === "default" && "bg-muted text-muted-foreground",
        tone === "primary" && "bg-primary/10 text-primary",
        tone === "violet" && "bg-violet-500/10 text-violet-600",
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/**
 * Grid layout for the photo wall keyed by photo count. Each entry declares the
 * grid template, the container height, and an optional per-photo span override
 * (e.g. making the first photo wider for a 5-photo collage).
 */
function getWallLayout(count: number): {
  gridClass: string;
  heightClass: string;
  spans: string[];
} {
  switch (count) {
    case 1:
      return { gridClass: "grid-cols-1", heightClass: "h-56", spans: [""] };
    case 2:
      return { gridClass: "grid-cols-2", heightClass: "h-48", spans: ["", ""] };
    case 3:
      return {
        gridClass: "grid-cols-3",
        heightClass: "h-44",
        spans: ["", "", ""],
      };
    case 4:
      return {
        gridClass: "grid-cols-2 grid-rows-2",
        heightClass: "h-56",
        spans: ["", "", "", ""],
      };
    case 5:
      return {
        gridClass: "grid-cols-3 grid-rows-2",
        heightClass: "h-56",
        spans: ["col-span-2", "", "", "", ""],
      };
    default:
      return {
        gridClass: "grid-cols-3 grid-rows-2",
        heightClass: "h-56",
        spans: ["", "", "", "", "", ""],
      };
  }
}

function PhotoWall({
  photos,
  name,
  hasProfile,
}: {
  photos: string[];
  name: string;
  hasProfile: boolean;
}) {
  if (photos.length === 0) {
    return (
      <div className="relative h-40 bg-gradient-to-br from-primary via-primary/85 to-accent flex items-center justify-center">
        <div className="absolute -right-4 -top-6 size-24 rounded-full bg-white/15" />
        <div className="absolute right-16 top-3 size-10 rounded-full bg-white/10" />
        <span className="relative text-white/90 text-sm font-medium">
          {hasProfile ? "还没有上传照片" : "欢迎来到相亲平台"}
        </span>
      </div>
    );
  }

  const { gridClass, heightClass, spans } = getWallLayout(photos.length);

  return (
    <div className={cn("grid gap-1", gridClass, heightClass)}>
      {photos.map((src, i) => (
        <div
          key={i}
          className={cn("relative overflow-hidden bg-muted", spans[i])}
        >
          <Image
            src={src}
            alt={`${name} 照片 ${i + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 240px"
          />
        </div>
      ))}
    </div>
  );
}

export function ProfileHero({
  userName,
  profile,
  ecr,
  mbtiType,
}: {
  userName: string;
  profile: ProfileHeroData | null;
  ecr: { emoji: string; label: string } | null;
  mbtiType: string | null;
}) {
  const photos = profile ? parsePhotos(profile.photos) : [];
  const displayName = profile?.name ?? userName;

  return (
    <Card className="overflow-hidden py-0 gap-0">
      {/* Photo wall */}
      <PhotoWall photos={photos} name={displayName} hasProfile={!!profile} />

      <CardContent className="px-5 sm:px-6 pb-6 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-xl font-bold truncate">{displayName}</h2>
            {profile && <StatusBadge status={profile.status} />}
          </div>
          <Link href="/dashboard/profile" className="shrink-0">
            <Button variant="outline" size="sm">
              <Pencil className="size-3.5" />
              {profile ? "编辑" : "填写资料"}
            </Button>
          </Link>
        </div>

        {profile ? (
          <>
            <p className="text-sm text-muted-foreground mt-1">
              {profile.gender} · {profile.age}岁 · {profile.area}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Chip icon={<Briefcase className="size-3.5" />}>
                {profile.occupation}
              </Chip>
              <Chip icon={<MapPin className="size-3.5" />}>
                {profile.area}
              </Chip>
              {ecr && (
                <Chip icon={<Heart className="size-3.5" />} tone="primary">
                  {ecr.emoji} {ecr.label}
                </Chip>
              )}
              {mbtiType && (
                <Chip icon={<Sparkles className="size-3.5" />} tone="violet">
                  {mbtiType}
                </Chip>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            完善资料并通过审核后，即可逛相亲墙、完成性格测试，开启你的寻缘之旅。
          </p>
        )}
      </CardContent>
    </Card>
  );
}
