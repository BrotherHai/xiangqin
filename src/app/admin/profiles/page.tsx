import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "@/components/admin/profile-card";
import { Pagination, PAGE_SIZE } from "@/components/shared/pagination";

export default async function ProfilesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);

  const [profiles, total] = await Promise.all([
    prisma.profile.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.profile.count(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">资料管理</h2>
        <Link href="/admin/profiles/create">
          <Button>新建资料</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((p) => (
          <ProfileCard key={p.id} profile={p} />
        ))}
      </div>
      {profiles.length === 0 && (
        <p className="text-center text-muted-foreground py-12">暂无资料</p>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/profiles" />
    </div>
  );
}
