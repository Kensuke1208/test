import { describe, it, expect } from "vitest";
import { toModuleProgress, toWordMastery } from "./view-types";

describe("toModuleProgress", () => {
  it("converts a row with values", () => {
    const row = { mastered_words: 5, total_words: 10, completed: true } as any;
    expect(toModuleProgress(row)).toEqual({
      mastered_words: 5,
      total_words: 10,
      completed: true,
    });
  });

  it("defaults null values to zero/false", () => {
    const row = { mastered_words: null, total_words: null, completed: null } as any;
    expect(toModuleProgress(row)).toEqual({
      mastered_words: 0,
      total_words: 0,
      completed: false,
    });
  });
});

describe("toWordMastery", () => {
  it("converts a row with values", () => {
    const row = { score: 85, steps_cleared: 2, steps_total: 3, mastered: false } as any;
    expect(toWordMastery(row)).toEqual({
      score: 85,
      steps_cleared: 2,
      steps_total: 3,
      mastered: false,
    });
  });

  it("defaults null values to zero/false", () => {
    const row = { score: null, steps_cleared: null, steps_total: null, mastered: null } as any;
    expect(toWordMastery(row)).toEqual({
      score: 0,
      steps_cleared: 0,
      steps_total: 0,
      mastered: false,
    });
  });
});
