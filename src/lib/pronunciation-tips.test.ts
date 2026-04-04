import { describe, it, expect } from "vitest";
import { getPronunciationTip } from "./pronunciation-tips";

describe("getPronunciationTip", () => {
  it("returns tip for known confusion patterns", () => {
    expect(getPronunciationTip("r", "l")).toBe("舌の先を上に曲げて、どこにもつけないでね");
    expect(getPronunciationTip("l", "r")).toBe("舌の先を上の歯のうらにつけてみよう");
    expect(getPronunciationTip("th", "s")).toBe("舌を歯の間にはさんでみよう");
    expect(getPronunciationTip("dh", "z")).toBe("舌を歯の間にはさんで声を出してみよう");
    expect(getPronunciationTip("v", "b")).toBe("上の歯で下のくちびるに軽くふれてみよう");
    expect(getPronunciationTip("f", "h")).toBe("上の歯で下のくちびるにふれて息を出してみよう");
  });

  it("returns null for unknown patterns", () => {
    expect(getPronunciationTip("p", "b")).toBeNull();
    expect(getPronunciationTip("r", "r")).toBeNull();
    expect(getPronunciationTip("unknown", "x")).toBeNull();
  });
});
