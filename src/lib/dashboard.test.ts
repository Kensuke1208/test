import { describe, it, expect } from "vitest";
import { groupRecentActivity, splitPhonemeStats } from "./dashboard";
import type { AttemptRow, PhonemeStatRow } from "./dashboard";

describe("groupRecentActivity", () => {
  const wordModuleMap = new Map([
    ["w1", "Nature"],
    ["w2", "Nature"],
    ["w3", "Animals"],
  ]);

  it("returns empty array for no attempts", () => {
    expect(groupRecentActivity([], wordModuleMap)).toEqual([]);
  });

  it("groups attempts by date and module", () => {
    const attempts: AttemptRow[] = [
      { created_at: "2026-04-03T01:00:00Z", score: 85, word_id: "w1" },
      { created_at: "2026-04-03T02:00:00Z", score: 70, word_id: "w2" },
      { created_at: "2026-04-02T01:00:00Z", score: 90, word_id: "w3" },
    ];
    const result = groupRecentActivity(attempts, wordModuleMap);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe("4/3");
    expect(result[0].entries[0]).toMatchObject({ moduleTitle: "Nature", wordCount: 2 });
    expect(result[1].date).toBe("4/2");
    expect(result[1].entries[0]).toMatchObject({ moduleTitle: "Animals", wordCount: 1 });
  });

  it("counts unique words, not attempts", () => {
    const attempts: AttemptRow[] = [
      { created_at: "2026-04-03T01:00:00Z", score: 60, word_id: "w1" },
      { created_at: "2026-04-03T02:00:00Z", score: 85, word_id: "w1" },
      { created_at: "2026-04-03T03:00:00Z", score: 90, word_id: "w1" },
    ];
    const result = groupRecentActivity(attempts, wordModuleMap);
    expect(result[0].entries[0].wordCount).toBe(1);
  });

  it("counts passed words using PASS_THRESHOLD", () => {
    const attempts: AttemptRow[] = [
      { created_at: "2026-04-03T01:00:00Z", score: 80, word_id: "w1" },
      { created_at: "2026-04-03T02:00:00Z", score: 79, word_id: "w2" },
    ];
    const result = groupRecentActivity(attempts, wordModuleMap);
    expect(result[0].entries[0].passedCount).toBe(1);
  });

  it("limits to maxDays", () => {
    const attempts: AttemptRow[] = Array.from({ length: 10 }, (_, i) => ({
      created_at: `2026-04-${String(i + 1).padStart(2, "0")}T01:00:00Z`,
      score: 80,
      word_id: "w1",
    }));
    const result = groupRecentActivity(attempts, wordModuleMap, 3);
    expect(result).toHaveLength(3);
  });

  it("uses '不明' for unknown word_id", () => {
    const attempts: AttemptRow[] = [
      { created_at: "2026-04-03T01:00:00Z", score: 80, word_id: "unknown" },
    ];
    const result = groupRecentActivity(attempts, wordModuleMap);
    expect(result[0].entries[0].moduleTitle).toBe("不明");
  });
});

describe("splitPhonemeStats", () => {
  it("returns empty arrays when no phonemes", () => {
    expect(splitPhonemeStats([])).toEqual({ weak: [], strong: [] });
  });

  it("filters out phonemes below minimum count", () => {
    const phonemes: PhonemeStatRow[] = [
      { phone: "r", accuracy: 0.3, totalCount: 3, mostCommonMistake: "l" },
    ];
    const result = splitPhonemeStats(phonemes, 5);
    expect(result.weak).toHaveLength(0);
    expect(result.strong).toHaveLength(0);
  });

  it("splits into weak (< 0.8) and strong (>= 0.8)", () => {
    const phonemes: PhonemeStatRow[] = [
      { phone: "r", accuracy: 0.4, totalCount: 10, mostCommonMistake: "l" },
      { phone: "s", accuracy: 0.9, totalCount: 10, mostCommonMistake: null },
      { phone: "th", accuracy: 0.3, totalCount: 10, mostCommonMistake: "s" },
      { phone: "p", accuracy: 0.95, totalCount: 10, mostCommonMistake: null },
    ];
    const result = splitPhonemeStats(phonemes);
    expect(result.weak).toHaveLength(2);
    expect(result.weak[0].phone).toBe("th"); // lowest accuracy first
    expect(result.strong).toHaveLength(2);
    expect(result.strong[0].phone).toBe("p"); // highest accuracy first
  });

  it("limits weak to 3 and strong to 3", () => {
    const phonemes: PhonemeStatRow[] = [
      { phone: "a", accuracy: 0.1, totalCount: 10, mostCommonMistake: null },
      { phone: "b", accuracy: 0.2, totalCount: 10, mostCommonMistake: null },
      { phone: "c", accuracy: 0.3, totalCount: 10, mostCommonMistake: null },
      { phone: "d", accuracy: 0.4, totalCount: 10, mostCommonMistake: null },
      { phone: "e", accuracy: 0.85, totalCount: 10, mostCommonMistake: null },
      { phone: "f", accuracy: 0.9, totalCount: 10, mostCommonMistake: null },
      { phone: "g", accuracy: 0.95, totalCount: 10, mostCommonMistake: null },
      { phone: "h", accuracy: 0.99, totalCount: 10, mostCommonMistake: null },
    ];
    const result = splitPhonemeStats(phonemes);
    expect(result.weak).toHaveLength(3);
    expect(result.strong).toHaveLength(3);
  });
});
