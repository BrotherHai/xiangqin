import { prisma } from "@/lib/prisma";
import { scoreEcrFromAnswers, type EcrResult } from "@/lib/ecr";

/**
 * Data-access helpers shared by the dashboard server components and the
 * user-facing API routes. Centralizing this avoids duplicating the
 * introduction-mapping logic and ensures we never leak sensitive fields
 * (e.g. password hashes) to the client.
 */

const OTHER_PROFILE_SELECT = {
  id: true,
  name: true,
  gender: true,
  age: true,
  area: true,
  occupation: true,
  wechat: true,
  phone: true,
  userId: true,
} as const;

export interface DashboardData {
  name: string;
  phone: string | null;
  profile: {
    id: string;
    name: string;
    gender: string;
    age: number;
    area: string;
    occupation: string;
    wechat: string | null;
    phone: string | null;
    requirement: string;
    background: string | null;
    status: string;
    photos: string;
    expectMinAge: number | null;
    expectMaxAge: number | null;
    expectArea: string | null;
  } | null;
  ecr: EcrResult | null;
  mbti: { id: string; type: string; scores: string; answers: string } | null;
}

export async function getDashboardData(userId: string): Promise<DashboardData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          testAnswers: { include: { question: { select: { sortOrder: true } } } },
          mbtiResult: true,
        },
      },
    },
  });
  if (!user) return null;

  if (!user.profile) {
    return { name: user.name, phone: user.phone, profile: null, ecr: null, mbti: null };
  }

  const { testAnswers, mbtiResult, ...profileRest } = user.profile;
  return {
    name: user.name,
    phone: user.phone,
    profile: profileRest,
    ecr: scoreEcrFromAnswers(testAnswers),
    mbti: mbtiResult,
  };
}

export interface IntroItem {
  id: string;
  status: string;
  mySide: string;
  otherSide: string;
  message: string | null;
  other: {
    name: string;
    gender: string;
    age: number;
    area: string;
    occupation: string;
    wechat: string | null;
    phone: string | null;
  };
}

export async function getUserIntroductions(userId: string): Promise<IntroItem[]> {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return [];

  const introductions = await prisma.introduction.findMany({
    where: { OR: [{ givenById: profile.id }, { receivedById: profile.id }] },
    include: { givenBy: { select: OTHER_PROFILE_SELECT }, receivedBy: { select: OTHER_PROFILE_SELECT } },
    orderBy: { createdAt: "desc" },
  });

  return introductions.map((intro) => {
    const isGivenBy = intro.givenBy.userId === userId;
    const other = isGivenBy ? intro.receivedBy : intro.givenBy;
    const mySide = isGivenBy ? intro.givenByStatus : intro.receivedByStatus;
    const otherSide = isGivenBy ? intro.receivedByStatus : intro.givenByStatus;
    const exchanged = intro.status === "exchanged";
    return {
      id: intro.id,
      status: intro.status,
      mySide,
      otherSide,
      message: intro.message,
      other: {
        name: other.name,
        gender: other.gender,
        age: other.age,
        area: other.area,
        occupation: other.occupation,
        wechat: exchanged ? other.wechat : null,
        phone: exchanged ? other.phone : null,
      },
    };
  });
}
