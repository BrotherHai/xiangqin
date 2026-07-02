import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ecrQuestionnaire } from "@/lib/ecr";
import { TestForm } from "./test-form";

export default async function TestPage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await params;

  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? null;
  const userId = session?.user?.id ?? null;
  if (!session || role !== "user") redirect("/login");

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) notFound();
  if (profile.userId !== userId) redirect("/dashboard");

  const questions = await prisma.testQuestion.findMany({ orderBy: { sortOrder: "asc" } });
  const answerCount = await prisma.testAnswer.count({ where: { profileId } });

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">暂无测试题目，请联系管理员</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">{ecrQuestionnaire.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{ecrQuestionnaire.subtitle}</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 text-sm text-muted-foreground">
          {ecrQuestionnaire.instruction}
        </div>
        <TestForm profileId={profileId} questions={questions} hasAnswers={answerCount > 0} />
      </div>
    </div>
  );
}
