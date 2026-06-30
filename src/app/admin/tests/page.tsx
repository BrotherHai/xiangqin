import { prisma } from "@/lib/prisma";
import { TestQuestionList } from "@/components/admin/test-question-list";

export default async function TestsPage() {
  const questions = await prisma.testQuestion.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">性格测试管理</h2>
      <TestQuestionList questions={questions} />
    </div>
  );
}
