import { describe, it, expect } from "vitest";
import { displayPhone } from "./phoneme-display";

describe("displayPhone", () => {
  it("maps known ARPABET phonemes to friendly display", () => {
    expect(displayPhone("r")).toBe('"r"');
    expect(displayPhone("l")).toBe('"l"');
    expect(displayPhone("th")).toBe('"th"');
    expect(displayPhone("dh")).toBe('"th"');
    expect(displayPhone("v")).toBe('"v"');
    expect(displayPhone("f")).toBe('"f"');
    expect(displayPhone("ae")).toBe('"a"');
    expect(displayPhone("ah")).toBe('"u"');
    expect(displayPhone("aa")).toBe('"o"');
    expect(displayPhone("ih")).toBe('"i"');
    expect(displayPhone("uh")).toBe('"oo"');
    expect(displayPhone("ax")).toBe('"a"');
  });

  it("wraps unknown phonemes in quotes as fallback", () => {
    expect(displayPhone("ng")).toBe('"ng"');
    expect(displayPhone("ey")).toBe('"ey"');
  });
});
