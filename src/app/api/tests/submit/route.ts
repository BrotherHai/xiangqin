import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { profileId, answers } = await req.json();

  await prisma.testAnswer.deleteMany({ where: { profileId } });

  await prisma.testAnswer.createMany({
    data: answers.map((a: { questionId: string; score: number }) => ({
      profileId,
      questionId: a.questionId,
      score: a.score,
    })),
  });

  return NextResponse.json({ success: true });
}
