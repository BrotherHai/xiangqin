import { prisma } from "@/lib/prisma";
import { IntroductionsList } from "@/components/admin/introductions-list";
import { Pagination, PAGE_SIZE } from "@/components/shared/pagination";

export default async function IntroductionsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);

  const [introductions, total] = await Promise.all([
    prisma.introduction.findMany({
      include: {
        givenBy: { select: { name: true, gender: true, age: true, wechat: true, phone: true } },
        receivedBy: { select: { name: true, gender: true, age: true, wechat: true, phone: true } },
        admin: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.introduction.count(),
  ]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">牵线管理</h2>
      <IntroductionsList introductions={introductions} />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/introductions" />
    </div>
  );
}
