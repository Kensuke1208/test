import { describe, it, expect } from "vitest";
import { pickRecommendation, pickWeakestPhoneme } from "./recommendation";
import type { MasteryRow, WordRow, PhonemeRow } from "./recommendation";

const words: WordRow[] = [
  { id: "w1", module_id: "m1", text: "river", meaning_ja: "川" },
  { id: "w2", module_id: "m1", text: "mountain", meaning_ja: "山" },
  { id: "w3", module_id: "m1", text: "flower", meaning_ja: "花" },
];

describe("pickRecommendation", () => {
  it("returns null when no words exist", () => {
    expect(pickRecommendation([], [], 0, 0)).toBeNull();
  });

  it("returns null when all words are mastered", () => {
    const mastery: MasteryRow[] = [
      { word_id: "w1", score: 90, mastered: true },
      { word_id: "w2", score: 85, mastered: true },
      { word_id: "w3", score: 80, mastered: true },
    ];
    expect(pickRecommendation(mastery, words, 3, 3)).toBeNull();
  });

  it("priority 1: picks attempted-but-not-mastered word with highest score", () => {
    const mastery: MasteryRow[] = [
      { word_id: "w1", score: 70, mastered: false },
      { word_id: "w2", score: 75, mastered: false },
    ];
    const result = pickRecommendation(mastery, words, 0, 3);
    expect(result).toMatchObject({ wordId: "w2", score: 75, text: "mountain" });
  });

  it("priority 2: picks first unattempted word when no almost-there", () => {
    const mastery: MasteryRow[] = [
      { word_id: "w1", score: 90, mastered: true },
    ];
    const result = pickRecommendation(mastery, words, 1, 3);
    expect(result).toMatchObject({ wordId: "w2", score: 0, text: "mountain" });
  });

  it("skips mastered words in priority 1", () => {
    const mastery: MasteryRow[] = [
      { word_id: "w1", score: 90, mastered: true },
      { word_id: "w2", score: 60, mastered: false },
    ];
    const result = pickRecommendation(mastery, words, 1, 3);
    expect(result).toMatchObject({ wordId: "w2", score: 60 });
  });

  it("returns first word when no attempts at all", () => {
    const result = pickRecommendation([], words, 0, 3);
    expect(result).toMatchObject({ wordId: "w1", score: 0, text: "river" });
  });

  it("respects word list order for unattempted", () => {
    const mastery: MasteryRow[] = [
      { word_id: "w1", score: 90, mastered: true },
      { word_id: "w2", score: 90, mastered: true },
    ];
    const result = pickRecommendation(mastery, words, 2, 3);
    expect(result).toMatchObject({ wordId: "w3", text: "flower" });
  });
});

describe("pickWeakestPhoneme", () => {
  it("returns null when no phonemes", () => {
    expect(pickWeakestPhoneme([])).toBeNull();
  });

  it("returns null when all below minimum count", () => {
    const phonemes: PhonemeRow[] = [
      { phone: "r", accuracy: 0.3, totalCount: 3, mostCommonMistake: "l" },
    ];
    expect(pickWeakestPhoneme(phonemes, 5)).toBeNull();
  });

  it("returns lowest accuracy phoneme with enough data", () => {
    const phonemes: PhonemeRow[] = [
      { phone: "r", accuracy: 0.4, totalCount: 10, mostCommonMistake: "l" },
      { phone: "th", accuracy: 0.2, totalCount: 8, mostCommonMistake: "s" },
      { phone: "v", accuracy: 0.9, totalCount: 6, mostCommonMistake: null },
    ];
    expect(pickWeakestPhoneme(phonemes)).toMatchObject({ phone: "th", accuracy: 0.2 });
  });

  it("filters out phonemes below minimum count", () => {
    const phonemes: PhonemeRow[] = [
      { phone: "r", accuracy: 0.1, totalCount: 2, mostCommonMistake: "l" },
      { phone: "th", accuracy: 0.5, totalCount: 10, mostCommonMistake: "s" },
    ];
    expect(pickWeakestPhoneme(phonemes)).toMatchObject({ phone: "th" });
  });
});
