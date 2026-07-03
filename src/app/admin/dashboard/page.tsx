import { prisma } from "@/lib/prisma";

// 仪表盘统计必须实时反映数据库状态，强制动态渲染，避免构建时把空库的 0 固化进静态产物。
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [total, pending, approved, introductions] = await Promise.all([
    prisma.profile.count(),
    prisma.profile.count({ where: { status: "pending" } }),
    prisma.profile.count({ where: { status: "approved" } }),
    prisma.introduction.count(),
  ]);

  const stats = [
    { label: "总资料数", value: total },
    { label: "待审核", value: pending },
    { label: "已通过", value: approved },
    { label: "牵线记录", value: introductions },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">仪表盘</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-xl p-6 shadow-sm border">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
