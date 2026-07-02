import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { scoreEcrFromAnswers } from "@/lib/ecr";
import { computeCompatibility, type ProfileBasics } from "@/lib/compatibility";

// Safety cap when sorting by compatibility: we materialize all matching
// profiles into memory to compute + sort. 500 is far beyond any realistic
// approved-profile count for this app and keeps memory bounded.
const SORT_CAP = 500;

export async function GET(req: Request) {
  const { session, error } = await requireUser();
  if (error) return error;
  const userId = session!.user.id;

  const { searchParams } = new URL(req.url);
  const minAge = searchParams.get("minAge");
  const maxAge = searchParams.get("maxAge");
  const area = searchParams.get("area");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.max(1, Math.min(48, parseInt(searchParams.get("pageSize") || "9", 10) || 9));
  // sort=compatibility → rank by computed total desc; default → newest first.
  const sort = searchParams.get("sort") === "compatibility" ? "compatibility" : "newest";

  const me = await prisma.profile.findUnique({
    where: { userId },
    select: {
      id: true,
      gender: true,
      age: true,
      area: true,
      expectMinAge: true,
      expectMaxAge: true,
      expectArea: true,
      testAnswers: { select: { score: true, question: { select: { sortOrder: true } } } },
      mbtiResult: { select: { type: true } },
    },
  });

  // The wall is opposite-gender only: boys see girls, girls see boys. The
  // viewer must therefore have a profile with a known gender to browse.
  const targetGender = me?.gender === "男" ? "女" : me?.gender === "女" ? "男" : null;
  if (!targetGender) {
    return NextResponse.json({ data: [], hasMore: false, myTestsReady: false, needsProfile: true });
  }

  const where: Prisma.ProfileWhereInput = { status: "approved", gender: targetGender };
  if (me) where.id = { not: me.id };
  if (minAge || maxAge) {
    const ageFilter: { gte?: number; lte?: number } = {};
    if (minAge) ageFilter.gte = parseInt(minAge);
    if (maxAge) ageFilter.lte = parseInt(maxAge);
    where.age = ageFilter;
  }
  if (area) where.area = { contains: area };

  const myEcr = me ? scoreEcrFromAnswers(me.testAnswers) : null;
  const myMbti = me?.mbtiResult?.type ?? null;
  const myTestsReady = !!myEcr && !!myMbti;
  const myBasics: ProfileBasics | null = me
    ? {
        age: me.age,
        area: me.area,
        expectMinAge: me.expectMinAge,
        expectMaxAge: me.expectMaxAge,
        expectArea: me.expectArea,
      }
    : null;

  const profileSelect = {
    id: true,
    name: true,
    gender: true,
    age: true,
    area: true,
    occupation: true,
    photos: true,
    requirement: true,
    background: true,
    expectMinAge: true,
    expectMaxAge: true,
    expectArea: true,
    testAnswers: { select: { score: true, question: { select: { sortOrder: true } } } },
    mbtiResult: { select: { type: true } },
  } as const;

  const buildCompat = (p: Prisma.ProfileGetPayload<{ select: typeof profileSelect }>) => {
    const ecr = scoreEcrFromAnswers(p.testAnswers);
    const wallMbti = p.mbtiResult ? p.mbtiResult.type : null;
    const targetBasics: ProfileBasics = {
      age: p.age,
      area: p.area,
      expectMinAge: p.expectMinAge,
      expectMaxAge: p.expectMaxAge,
      expectArea: p.expectArea,
    };
    return computeCompatibility({
      ecrA: myEcr?.dimensions ?? null,
      ecrB: ecr?.dimensions ?? null,
      mbtiA: myMbti,
      mbtiB: wallMbti,
      basicsA: myBasics ?? {
        age: null, area: null, expectMinAge: null, expectMaxAge: null, expectArea: null,
      },
      basicsB: targetBasics,
    });
  };

  // Compatibility sort requires computing the score for every candidate, so
  // fetch up to SORT_CAP and rank in JS. Otherwise use DB-level pagination.
  if (sort === "compatibility" && myTestsReady && myBasics) {
    const all = await prisma.profile.findMany({
      where,
      select: profileSelect,
      orderBy: { createdAt: "desc" },
      take: SORT_CAP,
    });

    const ranked = all
      .map((p) => {
        const compat = buildCompat(p);
        const { mbtiResult, ...rest } = p;
        const wallMbti = mbtiResult ? mbtiResult.type : null;
        const ecr = scoreEcrFromAnswers(p.testAnswers);
        return {
          ...rest,
          attachment: ecr ? { type: ecr.type, label: ecr.result.label, emoji: ecr.result.emoji } : null,
          mbti: wallMbti,
          compatibility: { total: compat.total, level: compat.level },
        };
      })
      .sort((a, b) => (b.compatibility!.total - a.compatibility!.total));

    const start = (page - 1) * pageSize;
    const slice = ranked.slice(start, start + pageSize);
    const hasMore = start + pageSize < ranked.length;
    return NextResponse.json({ data: slice, hasMore, myTestsReady, needsProfile: false });
  }

  const profiles = await prisma.profile.findMany({
    where,
    select: profileSelect,
    orderBy: { createdAt: "desc" },
    take: pageSize + 1,
    skip: (page - 1) * pageSize,
  });

  const hasMore = profiles.length > pageSize;
  const slice = hasMore ? profiles.slice(0, pageSize) : profiles;

  const data = slice.map((p) => {
    const ecr = scoreEcrFromAnswers(p.testAnswers);
    const { mbtiResult, ...rest } = p;
    const wallMbti = mbtiResult ? mbtiResult.type : null;
    const compat = computeCompatibility({
      ecrA: myEcr?.dimensions ?? null,
      ecrB: ecr?.dimensions ?? null,
      mbtiA: myMbti,
      mbtiB: wallMbti,
      basicsA: myBasics ?? {
        age: null, area: null, expectMinAge: null, expectMaxAge: null, expectArea: null,
      },
      basicsB: {
        age: p.age,
        area: p.area,
        expectMinAge: p.expectMinAge,
        expectMaxAge: p.expectMaxAge,
        expectArea: p.expectArea,
      },
    });
    return {
      ...rest,
      attachment: ecr ? { type: ecr.type, label: ecr.result.label, emoji: ecr.result.emoji } : null,
      mbti: wallMbti,
      compatibility: myTestsReady ? { total: compat.total, level: compat.level } : null,
    };
  });

  return NextResponse.json({ data, hasMore, myTestsReady, needsProfile: false });
}
