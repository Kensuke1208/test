import type { Phoneme } from "./api";

// Must match the threshold hardcoded in supabase/schemas/22_practice_views.sql
export const PASS_THRESHOLD = 80;

export type ScoreTier = "excellent" | "good" | "close" | "retry";

export function getScoreTier(score: number): ScoreTier {
  if (score >= 90) return "excellent";
  if (score >= PASS_THRESHOLD) return "good";
  if (score >= 60) return "close";
  return "retry";
}

export function getTierMessage(tier: ScoreTier): string {
  switch (tier) {
    case "excellent":
      return "かんぺき！";
    case "good":
      return "上手に言えたね！";
    case "close":
      return "おしい！ここを直してみよう";
    case "retry":
      return "お手本を聞いてからもう一度言ってみよう";
  }
}

export function getCorrectCount(phonemes: Phoneme[]): {
  correct: number;
  total: number;
} {
  const total = phonemes.length;
  const correct = phonemes.filter((p) => p.is_correct).length;
  return { correct, total };
}

export function isPassing(score: number): boolean {
  return score >= PASS_THRESHOLD;
}
