import type { MbtiResult, Profile, TestAnswer } from "@prisma/client";
import type { EcrResult } from "./ecr";

export type ProfileStatus = "pending" | "approved" | "rejected";

export interface ProfileCardData {
  id: string;
  name: string;
  gender: string;
  age: number;
  area: string;
  occupation: string;
  status: string;
}

export type ProfileDetailData = Profile & {
  testAnswers: (TestAnswer & { question: { title: string; dimension: string; sortOrder: number } })[];
  mbtiResult: MbtiResult | null;
};

export interface ProfileDetailProps {
  profile: ProfileDetailData;
  ecr: EcrResult | null;
  mbti: MbtiResult | null;
}

export interface MbtiScorePair {
  pair: string;
  values: Record<string, number>;
}

export interface IntroductionListItem {
  id: string;
  status: string;
  givenByStatus: string;
  receivedByStatus: string;
  message: string | null;
  givenBy: { name: string; gender: string; age: number; wechat: string | null; phone: string | null };
  receivedBy: { name: string; gender: string; age: number; wechat: string | null; phone: string | null };
  admin: { name: string };
}

export interface MatchRequestListItem {
  id: string;
  status: string;
  message: string | null;
  applicant: { name: string; gender: string; age: number; area: string };
  target: { name: string; gender: string; age: number; area: string };
}

export interface TestQuestionOption {
  text: string;
  score: number;
}

export interface TestQuestion {
  id: string;
  title: string;
  dimension: string;
  options: string;
  sortOrder: number;
}

export interface TestQuestionInput {
  title: string;
  dimension: string;
  options: TestQuestionOption[];
  sortOrder: number;
}
