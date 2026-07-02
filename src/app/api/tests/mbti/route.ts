import { NextResponse } from "next/server";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { requireOwnerOrAdmin } from "@/lib/auth-guards";
import { scoreMbti, getMbtiContent, mbtiQuestions } from "@/lib/mbti";
import { parseJson, asString, jsonError } from "@/lib/validate";

export async function POST(req: Request) {
  const csrfError = assertCsrf(req); if (csrfError) return csrfError;
  const { data: body, error: parseError } = await parseJson(req);
  if (parseError) return parseError;
  const profileId = asString(body.profileId);
  if (!profileId) return jsonError("缺少 profileId", 422);
  if (!Array.isArray(body.answers)) return jsonError("answers 必须为数组", 422);
  const answers = body.answers as string[];

  const { error } = await requireOwnerOrAdmin(profileId);
  if (error) return error;

  const mapped = answers.slice(0, mbtiQuestions.length).map((letter, idx) => {
    if (letter) return letter;
    return mbtiQuestions[idx].choice_a.value;
  });

  const score = scoreMbti(mapped);
  const content = getMbtiContent(score.type);

  const data = {
    type: score.type,
    scores: JSON.stringify(score.scores),
    answers: JSON.stringify(mapped),
  };

  const result = await prisma.mbtiResult.upsert({
    where: { profileId },
    update: data,
    create: { profileId, ...data },
  });

  return NextResponse.json({ result, content, scores: score.scores });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");
  if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 });

  const { error } = await requireOwnerOrAdmin(profileId);
  if (error) return error;

  const stored = await prisma.mbtiResult.findUnique({ where: { profileId } });
  if (!stored) return NextResponse.json({ result: null });

  const content = getMbtiContent(stored.type);
  return NextResponse.json({
    result: {
      type: stored.type,
      scores: JSON.parse(stored.scores),
      createdAt: stored.createdAt,
    },
    content,
  });
}
