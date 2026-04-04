export interface RecommendedWord {
  wordId: string;
  moduleId: string;
  text: string;
  meaningJa: string;
  score: number;
}

export interface MasteryRow {
  word_id: string;
  score: number;
  mastered: boolean;
}

export interface WordRow {
  id: string;
  module_id: string;
  text: string;
  meaning_ja: string;
}

export function pickRecommendation(
  mastery: MasteryRow[],
  wordList: WordRow[],
  masteredWords: number,
  totalWords: number,
): RecommendedWord | null {
  const wordMap = new Map(wordList.map((w) => [w.id, w]));

  // Priority 1: attempted but not mastered, highest score first ("almost there")
  const almostThere = mastery
    .filter((m) => !m.mastered && m.score > 0)
    .sort((a, b) => b.score - a.score);

  const candidate = almostThere[0];
  if (candidate) {
    const word = wordMap.get(candidate.word_id);
    if (word) {
      return {
        wordId: word.id,
        moduleId: word.module_id,
        text: word.text,
        meaningJa: word.meaning_ja,
        score: candidate.score,
      };
    }
  }

  // Priority 2: first unattempted word in display order
  if (masteredWords < totalWords) {
    const attemptedWordIds = new Set(mastery.map((m) => m.word_id));
    const unattempted = wordList.find((w) => !attemptedWordIds.has(w.id));
    if (unattempted) {
      return {
        wordId: unattempted.id,
        moduleId: unattempted.module_id,
        text: unattempted.text,
        meaningJa: unattempted.meaning_ja,
        score: 0,
      };
    }
  }

  return null;
}

export interface PhonemeRow {
  phone: string;
  accuracy: number;
  totalCount: number;
  mostCommonMistake: string | null;
}

export interface WeakestPhoneme {
  phone: string;
  accuracy: number;
  mostCommonMistake: string | null;
}

export function pickWeakestPhoneme(
  phonemes: PhonemeRow[],
  minCount: number = 5,
): WeakestPhoneme | null {
  const qualified = phonemes
    .filter((p) => p.totalCount >= minCount)
    .sort((a, b) => a.accuracy - b.accuracy);

  return qualified[0] ?? null;
}
