import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MbtiForm } from "@/components/mbti/mbti-form";

export default async function MbtiPage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await params;

  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? null;
  const userId = session?.user?.id ?? null;
  if (!session || role !== "user") redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) notFound();
  if (profile.userId !== userId) redirect("/dashboard");

  const existing = await prisma.mbtiResult.findUnique({ where: { profileId } });

  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">MBTI 性格测试</h1>
          <p className="text-sm text-muted-foreground mt-1">{profile.name}，请根据你的真实感受作答</p>
        </div>
        <MbtiForm profileId={profileId} hasResult={!!existing} />
      </div>
    </div>
  );
}
