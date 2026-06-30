import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "待审核", variant: "secondary" },
  approved: { label: "已通过", variant: "default" },
  rejected: { label: "已拒绝", variant: "destructive" },
};

export function ProfileCard({ profile }: { profile: any }) {
  const status = statusMap[profile.status] || statusMap.pending;

  return (
    <Link href={`/admin/profiles/${profile.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg">{profile.name}</h3>
              <p className="text-sm text-gray-500">{profile.gender} · {profile.age}岁 · {profile.area}</p>
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{profile.occupation}</p>
          <p className="text-xs text-gray-400 mt-2">推荐人: {profile.referrerName} ({profile.referrerRelation})</p>
        </CardContent>
      </Card>
    </Link>
  );
}
