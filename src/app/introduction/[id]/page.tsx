import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function IntroductionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const introduction = await prisma.introduction.findUnique({
    where: { id },
    include: {
      givenBy: true,
      receivedBy: true,
      admin: { select: { name: true } },
    },
  });
  if (!introduction) notFound();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">牵线详情</h1>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold">{introduction.givenBy.name}</p>
              <p className="text-sm text-gray-500">
                {introduction.givenBy.gender} · {introduction.givenBy.age}岁 · {introduction.givenBy.area}
              </p>
            </div>
            <p className="text-2xl text-gray-400">⇄</p>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold">{introduction.receivedBy.name}</p>
              <p className="text-sm text-gray-500">
                {introduction.receivedBy.gender} · {introduction.receivedBy.age}岁 · {introduction.receivedBy.area}
              </p>
            </div>
            {introduction.message && (
              <p className="text-sm text-gray-500 italic">&ldquo;{introduction.message}&rdquo;</p>
            )}
            <p className="text-xs text-gray-400">管理员: {introduction.admin.name}</p>
            <p className="text-sm text-gray-600">
              状态: {introduction.status === "pending" ? "待确认" : introduction.status === "accepted" ? "已通过" : "已拒绝"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
