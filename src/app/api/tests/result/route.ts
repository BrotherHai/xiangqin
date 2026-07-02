import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwnerOrAdmin } from "@/lib/auth-guards";
import { scoreEcr } from "@/lib/ecr";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");
  if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 });

  const { error } = await requireOwnerOrAdmin(profileId);
  if (error) return error;

  const answers = await prisma.testAnswer.findMany({
    where: { profileId },
    include: { question: { select: { sortOrder: true } } },
  });

  if (answers.length === 0) return NextResponse.json({ result: null });

  const mapped = answers.map((a) => ({ id: a.question.sortOrder, score: a.score }));
  const result = scoreEcr(mapped);
  return NextResponse.json({ result });
}
