import { describe, it, expect } from "vitest";
import { getScoreTier, getTierMessage, getCorrectCount, isPassing, PASS_THRESHOLD } from "./score";

describe("getScoreTier", () => {
  it("returns excellent for 90+", () => {
    expect(getScoreTier(90)).toBe("excellent");
    expect(getScoreTier(100)).toBe("excellent");
  });

  it("returns good for 80-89", () => {
    expect(getScoreTier(80)).toBe("good");
    expect(getScoreTier(89)).toBe("good");
  });

  it("returns close for 60-79", () => {
    expect(getScoreTier(60)).toBe("close");
    expect(getScoreTier(79)).toBe("close");
  });

  it("returns retry for 0-59", () => {
    expect(getScoreTier(0)).toBe("retry");
    expect(getScoreTier(59)).toBe("retry");
  });
});

describe("getTierMessage", () => {
  it("returns Japanese messages for each tier", () => {
    expect(getTierMessage("excellent")).toBe("かんぺき！");
    expect(getTierMessage("good")).toBe("上手に言えたね！");
    expect(getTierMessage("close")).toBe("おしい！ここを直してみよう");
    expect(getTierMessage("retry")).toBe("お手本を聞いてからもう一度言ってみよう");
  });
});

describe("getCorrectCount", () => {
  it("counts correct phonemes", () => {
    const phonemes = [
      { word: "river", phone: "r", quality_score: 90, sound_most_like: "r", is_correct: true },
      { word: "river", phone: "ih", quality_score: 80, sound_most_like: "ih", is_correct: true },
      { word: "river", phone: "v", quality_score: 30, sound_most_like: "b", is_correct: false },
    ];
    expect(getCorrectCount(phonemes)).toEqual({ correct: 2, total: 3 });
  });

  it("handles empty array", () => {
    expect(getCorrectCount([])).toEqual({ correct: 0, total: 0 });
  });
});

describe("isPassing", () => {
  it("returns true at threshold", () => {
    expect(isPassing(PASS_THRESHOLD)).toBe(true);
  });

  it("returns false below threshold", () => {
    expect(isPassing(PASS_THRESHOLD - 1)).toBe(false);
  });
});
