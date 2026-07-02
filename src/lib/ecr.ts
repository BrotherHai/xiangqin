import ecrData from "../../ecr-36.json";

export const ecrQuestionnaire = ecrData;

export type AttachmentType = "secure" | "fearful" | "preoccupied" | "dismissing";

export interface EcrResult {
  dimensions: { avoidance: number; anxiety: number };
  type: AttachmentType;
  result: {
    label: string;
    emoji: string;
    tagline: string;
    desc: string;
  };
}

function evalTypeFormula(formula: string, avoidance: number, anxiety: number): number {
  const aMatch = formula.match(/avoidance\s*\*\s*([0-9.]+)/i);
  const nMatch = formula.match(/anxiety\s*\*\s*([0-9.]+)/i);
  const cMatch = formula.match(/([+-])\s*([0-9.]+)\s*$/);
  const a = aMatch ? Number(aMatch[1]) : 0;
  const n = nMatch ? Number(nMatch[1]) : 0;
  const c = cMatch ? Number(cMatch[2]) * (cMatch[1] === "-" ? -1 : 1) : 0;
  return avoidance * a + anxiety * n + c;
}

export function scoreEcr(answers: { id: number; score: number }[]): EcrResult | null {
  if (answers.length === 0) return null;

  const scale = ecrData.scale;
  const reverseSet = new Set(ecrData.questions.filter((q) => q.reverse).map((q) => q.id));
  const avoidItems = new Set(ecrData.scoring.avoidance.items as number[]);
  const anxItems = new Set(ecrData.scoring.anxiety.items as number[]);

  let avoidSum = 0;
  let avoidCount = 0;
  let anxSum = 0;
  let anxCount = 0;

  for (const a of answers) {
    const eff = reverseSet.has(a.id) ? scale + 1 - a.score : a.score;
    if (avoidItems.has(a.id)) {
      avoidSum += eff;
      avoidCount++;
    }
    if (anxItems.has(a.id)) {
      anxSum += eff;
      anxCount++;
    }
  }

  const avoidance = avoidCount ? avoidSum / avoidCount : 0;
  const anxiety = anxCount ? anxSum / anxCount : 0;

  const types = ecrData.scoring.types;
  const scores: Record<AttachmentType, number> = {
    secure: evalTypeFormula(types.secure.formula, avoidance, anxiety),
    fearful: evalTypeFormula(types.fearful.formula, avoidance, anxiety),
    preoccupied: evalTypeFormula(types.preoccupied.formula, avoidance, anxiety),
    dismissing: evalTypeFormula(types.dismissing.formula, avoidance, anxiety),
  };

  const type = (Object.entries(scores) as [AttachmentType, number][])
    .sort((a, b) => b[1] - a[1])[0][0];

  return {
    dimensions: { avoidance, anxiety },
    type,
    result: ecrData.results[type],
  };
}

export function scoreEcrFromAnswers(
  answers: { score: number; question: { sortOrder: number } }[]
): EcrResult | null {
  return scoreEcr(answers.map((a) => ({ id: a.question.sortOrder, score: a.score })));
}
