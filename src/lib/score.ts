import { PASS_THRESHOLD } from "./api";
import type { Phoneme } from "./api";

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
      return "じょうずにいえたね！";
    case "close":
      return "おしい！ここをなおしてみよう";
    case "retry":
      return "おてほんをきいてからもういちどいってみよう";
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
