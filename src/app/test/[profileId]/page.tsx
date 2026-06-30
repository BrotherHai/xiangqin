import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TestForm } from "./test-form";

export default async function TestPage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = await params;
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) notFound();

  const questions = await prisma.testQuestion.findMany({ orderBy: { sortOrder: "asc" } });
  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">暂无测试题目，请联系管理员</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">性格测试</h1>
          <p className="text-gray-500 mt-2">{profile.name}，请根据实际情况选择</p>
        </div>
        <TestForm profileId={profileId} questions={questions} />
      </div>
    </div>
  );
}
