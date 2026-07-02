export type CompatibilityLevel = "推荐" | "一般" | "谨慎";

export interface ProfileBasics {
  age: number | null;
  area: string | null;
  expectMinAge: number | null;
  expectMaxAge: number | null;
  expectArea: string | null;
}

export interface CompatibilityInput {
  ecrA: { avoidance: number; anxiety: number } | null;
  ecrB: { avoidance: number; anxiety: number } | null;
  mbtiA: string | null;
  mbtiB: string | null;
  basicsA: ProfileBasics;
  basicsB: ProfileBasics;
}

export interface CompatibilityResult {
  total: number;
  ecrScore: number;
  mbtiScore: number;
  hardScore: number;
  level: CompatibilityLevel;
  levelColor: string;
  summary: string;
  detail: string[];
}

const EMPTY_BASICS: ProfileBasics = {
  age: null,
  area: null,
  expectMinAge: null,
  expectMaxAge: null,
  expectArea: null,
};

function ecrScore(
  a: { avoidance: number; anxiety: number } | null,
  b: { avoidance: number; anxiety: number } | null
): number {
  if (!a || !b) return 25;

  const maxDelta = 6;
  const avoidDelta = Math.abs(a.avoidance - b.avoidance);
  const anxietyDelta = Math.abs(a.anxiety - b.anxiety);
  const proximity = 1 - (avoidDelta + anxietyDelta) / (2 * maxDelta);
  const proximityPoints = proximity * 25;

  const security = (v: { avoidance: number; anxiety: number }) =>
    (7 - v.avoidance) + (7 - v.anxiety);
  const secMean = (security(a) + security(b)) / 2;
  const securityNorm = Math.min(secMean / 12, 1);
  const securityPoints = securityNorm * 20;

  let bonus = 0;
  if (a.avoidance < 3 && a.anxiety < 3 && b.avoidance < 3 && b.anxiety < 3) bonus = 5;

  const anxiousA = a.anxiety >= 5 && b.avoidance >= 5;
  const anxiousB = b.anxiety >= 5 && a.avoidance >= 5;
  if (anxiousA || anxiousB) bonus -= 8;

  return Math.max(0, Math.min(50, proximityPoints + securityPoints + bonus));
}

function mbtiScore(a: string | null, b: string | null): number {
  if (!a || !b || a.length !== 4 || b.length !== 4) return 25;

  let matchCount = 0;
  for (let i = 0; i < 4; i++) {
    if (a[i] === b[i]) matchCount++;
  }

  const matchPoints = matchCount * 10;
  const identityBonus = matchCount === 4 ? 8 : matchCount === 3 ? 3 : 0;

  return Math.max(0, Math.min(50, matchPoints + identityBonus));
}

/**
 * Check whether `age` falls within the expected range [expectMin, expectMax].
 * A null expectation bound means "no limit" on that side. A null age is
 * treated leniently (satisfies) since age is required in practice but we
 * guard against incomplete data.
 */
function ageSatisfies(
  age: number | null,
  expectMin: number | null,
  expectMax: number | null,
): boolean {
  if (age == null) return true;
  if (expectMin == null && expectMax == null) return true;
  if (expectMin != null && age < expectMin) return false;
  if (expectMax != null && age > expectMax) return false;
  return true;
}

/**
 * Check whether `area` matches the expected area keyword. A null/empty
 * expectation means "no limit". Matching is bidirectional substring
 * (case-insensitive) to tolerate e.g. area="北京市朝阳区" vs expect="北京".
 */
function areaSatisfies(area: string | null, expectArea: string | null): boolean {
  if (!expectArea) return true;
  if (!area) return true;
  const a = area.toLowerCase();
  const e = expectArea.toLowerCase();
  return a.includes(e) || e.includes(a);
}

/**
 * Hard-condition score based on bidirectional age + area satisfaction.
 * Returns ageScore (0-18), areaScore (0-12), total (0-30).
 */
function hardConditionScore(a: ProfileBasics, b: ProfileBasics): {
  ageScore: number;
  areaScore: number;
  total: number;
} {
  // Age: bidirectional — does B's age satisfy A's expectation AND vice versa?
  const aToB = ageSatisfies(b.age, a.expectMinAge, a.expectMaxAge);
  const bToA = ageSatisfies(a.age, b.expectMinAge, b.expectMaxAge);
  const ageScore = aToB && bToA ? 18 : aToB || bToA ? 9 : 0;

  // Area: bidirectional — does B's area satisfy A's expectation AND vice versa?
  const areaAToB = areaSatisfies(b.area, a.expectArea);
  const areaBToA = areaSatisfies(a.area, b.expectArea);
  const areaScore = areaAToB && areaBToA ? 12 : areaAToB || areaBToA ? 6 : 0;

  return { ageScore, areaScore, total: ageScore + areaScore };
}

function levelOf(total: number): CompatibilityLevel {
  if (total >= 70) return "推荐";
  if (total >= 50) return "一般";
  return "谨慎";
}

function colorOf(level: CompatibilityLevel): string {
  if (level === "推荐") return "green";
  if (level === "一般") return "yellow";
  return "red";
}

function buildDetail(
  input: CompatibilityInput,
  hard: { ageScore: number; areaScore: number },
): string[] {
  const detail: string[] = [];

  // Hard-condition descriptions.
  if (hard.ageScore === 18) detail.push("双方年龄互在对方期望范围内");
  else if (hard.ageScore === 9) detail.push("仅一方年龄符合对方期望");
  else detail.push("双方年龄均不在对方期望范围内，硬性条件不符");

  if (hard.areaScore === 12) detail.push("双方地区符合彼此期望");
  else if (hard.areaScore === 6) detail.push("仅一方地区符合对方期望");
  else detail.push("双方地区均不符合对方期望");

  if (input.ecrA && input.ecrB) {
    const avgSafe =
      (14 - input.ecrA.avoidance - input.ecrA.anxiety - input.ecrB.avoidance - input.ecrB.anxiety) / 2;
    if (avgSafe >= 9) detail.push("双方整体偏向安全型依恋，关系基础稳固");
    else if (avgSafe <= 6) detail.push("双方均存在一定依恋不安全感，需要更多耐心");
    if (
      (input.ecrA.anxiety >= 5 && input.ecrB.avoidance >= 5) ||
      (input.ecrB.anxiety >= 5 && input.ecrA.avoidance >= 5)
    ) {
      detail.push("存在「焦虑-回避」互动倾向，建议牵线后关注沟通方式");
    }
  } else {
    detail.push("缺少依恋测试结果，该项按中立分计算");
  }

  if (input.mbtiA && input.mbtiB) {
    let same = 0;
    for (let i = 0; i < 4; i++) if (input.mbtiA[i] === input.mbtiB[i]) same++;
    if (same === 4) detail.push(`MBTI 同为 ${input.mbtiA}，高度一致`);
    else detail.push(`MBTI ${input.mbtiA} × ${input.mbtiB}，有 ${same} 个维度相同`);
  } else {
    detail.push("缺少 MBTI 结果，该项按中立分计算");
  }

  return detail;
}

function buildSummary(level: CompatibilityLevel, total: number): string {
  if (level === "推荐")
    return `两人兼容度较高（${total} 分），牵线成功可能性大。`;
  if (level === "一般")
    return `两人兼容度一般（${total} 分），可牵线但需关注磨合。`;
  return `兼容度偏低（${total} 分），建议谨慎牵线并持续跟进。`;
}

export function computeCompatibility(input: CompatibilityInput): CompatibilityResult {
  const basicsA = input.basicsA ?? EMPTY_BASICS;
  const basicsB = input.basicsB ?? EMPTY_BASICS;

  const ecrRaw = ecrScore(input.ecrA, input.ecrB); // 0-50
  const mbtiRaw = mbtiScore(input.mbtiA, input.mbtiB); // 0-50
  const hard = hardConditionScore(basicsA, basicsB); // 0-30

  // Rescale psychological scores (0-50 each) to 0-35 each, hard conditions 0-30.
  const ecrScaled = ecrRaw * (35 / 50);
  const mbtiScaled = mbtiRaw * (35 / 50);

  let total = Math.round(Math.max(0, Math.min(100, ecrScaled + mbtiScaled + hard.total)));

  // Soft gate: if age mismatches both directions, cap at "谨慎" regardless of
  // psychological compatibility — hard conditions are a prerequisite.
  if (hard.ageScore === 0) total = Math.min(total, 49);

  const level = levelOf(total);
  return {
    total,
    ecrScore: Math.round(ecrRaw),
    mbtiScore: Math.round(mbtiRaw),
    hardScore: hard.total,
    level,
    levelColor: colorOf(level),
    summary: buildSummary(level, total),
    detail: buildDetail(input, hard),
  };
}
