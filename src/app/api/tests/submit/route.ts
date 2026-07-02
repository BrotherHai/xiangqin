import { NextResponse } from "next/server";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { requireOwnerOrAdmin } from "@/lib/auth-guards";
import { parseJson, asString, jsonError } from "@/lib/validate";

export async function POST(req: Request) {
  const csrfError = assertCsrf(req); if (csrfError) return csrfError;
  const { data: body, error: parseError } = await parseJson(req);
  if (parseError) return parseError;
  const profileId = asString(body.profileId);
  if (!profileId) return jsonError("缺少 profileId", 422);
  if (!Array.isArray(body.answers)) return jsonError("answers 必须为数组", 422);
  const answers = body.answers as { questionId: string; score: number }[];

  const { error } = await requireOwnerOrAdmin(profileId);
  if (error) return error;

  await prisma.$transaction([
    prisma.testAnswer.deleteMany({ where: { profileId } }),
    prisma.testAnswer.createMany({
      data: answers.map((a) => ({
        profileId,
        questionId: a.questionId,
        score: a.score,
      })),
    }),
  ]);

  return NextResponse.json({ success: true });
}
