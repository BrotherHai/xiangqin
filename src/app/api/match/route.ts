import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { scoreEcrFromAnswers } from "@/lib/ecr";

export interface MatchPerson {
  id: string;
  name: string;
  gender: string;
  age: number;
  area: string;
  occupation: string;
  requirement: string;
  background: string | null;
  expectMinAge: number | null;
  expectMaxAge: number | null;
  expectArea: string | null;
  ecr: { avoidance: number; anxiety: number; type: string | null } | null;
  mbti: string | null;
  mbtiScores: { pair: string; values: Record<string, number> }[] | null;
}

function ecrToResult(ecr: ReturnType<typeof scoreEcrFromAnswers>) {
  if (!ecr) return null;
  return { avoidance: Number(ecr.dimensions.avoidance.toFixed(2)), anxiety: Number(ecr.dimensions.anxiety.toFixed(2)), type: ecr.type };
}

export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const gender = searchParams.get("gender");
  const minAge = searchParams.get("minAge");
  const maxAge = searchParams.get("maxAge");
  const area = searchParams.get("area");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.max(1, Math.min(48, parseInt(searchParams.get("pageSize") || "12", 10) || 12));

  const where: Prisma.ProfileWhereInput = { status: "approved" };
  if (gender) where.gender = gender;
  if (minAge || maxAge) {
    const ageFilter: { gte?: number; lte?: number } = {};
    if (minAge) ageFilter.gte = parseInt(minAge);
    if (maxAge) ageFilter.lte = parseInt(maxAge);
    where.age = ageFilter;
  }
  if (area) where.area = { contains: area };

  const profiles = await prisma.profile.findMany({
    where,
    include: {
      testAnswers: { include: { question: { select: { sortOrder: true } } } },
      mbtiResult: true,
    },
    orderBy: { createdAt: "desc" },
    take: pageSize + 1,
    skip: (page - 1) * pageSize,
  });

  const hasMore = profiles.length > pageSize;
  const slice = hasMore ? profiles.slice(0, pageSize) : profiles;
  const result: MatchPerson[] = slice.map((p) => {
    const ecr = ecrToResult(scoreEcrFromAnswers(p.testAnswers));
    const mbtiResult = p.mbtiResult;
    return {
      id: p.id,
      name: p.name,
      gender: p.gender,
      age: p.age,
      area: p.area,
      occupation: p.occupation,
      requirement: p.requirement,
      background: p.background,
      expectMinAge: p.expectMinAge,
      expectMaxAge: p.expectMaxAge,
      expectArea: p.expectArea,
      ecr,
      mbti: mbtiResult ? mbtiResult.type : null,
      mbtiScores: mbtiResult ? JSON.parse(mbtiResult.scores) : null,
    };
  });

  return NextResponse.json({ data: result, hasMore });
}
