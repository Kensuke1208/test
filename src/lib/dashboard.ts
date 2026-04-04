import { PASS_THRESHOLD } from "./score";
import { formatJstDate } from "./jst-date";

export interface AttemptRow {
  created_at: string;
  score: number;
  word_id: string;
}

export interface ActivityGroup {
  date: string;
  entries: { moduleTitle: string; wordCount: number; passedCount: number }[];
}

export function groupRecentActivity(
  attempts: AttemptRow[],
  wordModuleMap: Map<string, string>,
  maxDays: number = 5,
): ActivityGroup[] {
  const grouped = new Map<
    string,
    Map<string, { wordIds: Set<string>; passedWordIds: Set<string> }>
  >();

  for (const a of attempts) {
    const dateKey = formatJstDate(a.created_at);
    const moduleTitle = wordModuleMap.get(a.word_id) ?? "不明";

    if (!grouped.has(dateKey)) grouped.set(dateKey, new Map());
    const dateMap = grouped.get(dateKey)!;
    if (!dateMap.has(moduleTitle))
      dateMap.set(moduleTitle, { wordIds: new Set(), passedWordIds: new Set() });
    const entry = dateMap.get(moduleTitle)!;
    entry.wordIds.add(a.word_id);
    if (a.score >= PASS_THRESHOLD) entry.passedWordIds.add(a.word_id);
  }

  const result: ActivityGroup[] = [];
  for (const [date, moduleEntries] of grouped) {
    const entries = [...moduleEntries.entries()].map(([moduleTitle, data]) => ({
      moduleTitle,
      wordCount: data.wordIds.size,
      passedCount: data.passedWordIds.size,
    }));
    result.push({ date, entries });
  }
  result.splice(maxDays);
  return result;
}

export interface PhonemeStatRow {
  phone: string;
  accuracy: number;
  totalCount: number;
  mostCommonMistake: string | null;
}

export interface PhonemeDisplay {
  phone: string;
  accuracy: number;
  mostCommonMistake: string | null;
}

export function splitPhonemeStats(
  phonemes: PhonemeStatRow[],
  minCount: number = 5,
): { weak: PhonemeDisplay[]; strong: PhonemeDisplay[] } {
  const qualified = phonemes
    .filter((p) => p.totalCount >= minCount)
    .sort((a, b) => a.accuracy - b.accuracy)
    .map((p) => ({
      phone: p.phone,
      accuracy: p.accuracy,
      mostCommonMistake: p.mostCommonMistake,
    }));

  return {
    weak: qualified.filter((p) => p.accuracy < 0.8).slice(0, 3),
    strong: qualified.filter((p) => p.accuracy >= 0.8).reverse().slice(0, 3),
  };
}
