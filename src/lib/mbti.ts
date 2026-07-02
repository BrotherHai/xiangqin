import questionsData from "../../mbtiquestions.json";
import contentData from "../../personality-content.json";

interface MbtiQuestion {
  question: string;
  choice_a: { value: string; text: string };
  choice_b: { value: string; text: string };
}

interface TypeContent {
  type: string;
  subtitle: string;
  description: string;
  contentHtml: string;
}

export const mbtiQuestions = questionsData as MbtiQuestion[];
export const mbtiContent = contentData as TypeContent[];

const DIMENSION_PAIRS = [
  ["E", "I"],
  ["S", "N"],
  ["T", "F"],
  ["J", "P"],
];

function dimensionIndexFor(letterA: string, letterB: string): number {
  const sorted = [letterA, letterB].sort();
  return DIMENSION_PAIRS.findIndex(
    (p) => p[0] === sorted[0] && p[1] === sorted[1]
  );
}

export interface MbtiScore {
  type: string;
  scores: Array<{ pair: string; values: Record<string, number> }>;
}

export function scoreMbti(answers: string[]): MbtiScore {
  const counts: Record<string, number>[] = [
    { E: 0, I: 0 },
    { S: 0, N: 0 },
    { T: 0, F: 0 },
    { J: 0, P: 0 },
  ];

  answers.forEach((letter, idx) => {
    if (idx >= mbtiQuestions.length) return;
    const q = mbtiQuestions[idx];
    const dimIdx = dimensionIndexFor(q.choice_a.value, q.choice_b.value);
    if (dimIdx < 0) return;
    if (letter in counts[dimIdx]) {
      counts[dimIdx][letter] += 1;
    }
  });

  const pairs = ["EI", "SN", "TF", "JP"];
  let type = "";
  const scores: Array<{ pair: string; values: Record<string, number> }> = [];

  pairs.forEach((pair, i) => {
    const a = pair[0];
    const b = pair[1];
    const aCount = counts[i][a];
    const bCount = counts[i][b];
    type += aCount >= bCount ? a : b;
    scores.push({ pair, values: { [a]: aCount, [b]: bCount } });
  });

  return { type, scores };
}

export function getMbtiContent(type: string): TypeContent | undefined {
  return mbtiContent.find((c) => c.type === type);
}
