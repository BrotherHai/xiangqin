import { prisma } from "@/lib/prisma";
import { IntroductionsList } from "@/components/admin/introductions-list";

export default async function IntroductionsPage() {
  const introductions = await prisma.introduction.findMany({
    include: {
      givenBy: { select: { name: true, gender: true, age: true } },
      receivedBy: { select: { name: true, gender: true, age: true } },
      admin: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">牵线管理</h2>
      <IntroductionsList introductions={introductions} />
    </div>
  );
}
