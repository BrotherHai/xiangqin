import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "@/components/admin/profile-card";

export default async function ProfilesPage() {
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "desc" },
  });

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
        <p className="text-center text-gray-400 py-12">暂无资料</p>
      )}
    </div>
  );
}
