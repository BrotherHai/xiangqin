import { prisma } from "@/lib/prisma";
import { MatchRequestList } from "@/components/admin/match-request-list";
import { Pagination, PAGE_SIZE } from "@/components/shared/pagination";

export default async function AdminRequestsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);

  const [requests, total] = await Promise.all([
    prisma.matchRequest.findMany({
      include: {
        applicant: { select: { id: true, name: true, gender: true, age: true, area: true } },
        target: { select: { id: true, name: true, gender: true, age: true, area: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.matchRequest.count(),
  ]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">牵线申请</h2>
      <MatchRequestList requests={requests} />
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/requests" />
    </div>
  );
}
