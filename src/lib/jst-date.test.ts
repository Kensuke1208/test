import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getJstMondayUtc, getJstDayOfWeek, formatJstDate } from "./jst-date";

describe("getJstDayOfWeek", () => {
  it("returns 0 for Monday JST", () => {
    // 2026-04-06 Mon 10:00 JST = 2026-04-06 01:00 UTC
    expect(getJstDayOfWeek("2026-04-06T01:00:00Z")).toBe(0);
  });

  it("returns 4 for Friday JST", () => {
    // 2026-04-03 Fri 10:00 JST = 2026-04-03 01:00 UTC
    expect(getJstDayOfWeek("2026-04-03T01:00:00Z")).toBe(4);
  });

  it("returns 6 for Sunday JST", () => {
    // 2026-04-05 Sun 10:00 JST = 2026-04-05 01:00 UTC
    expect(getJstDayOfWeek("2026-04-05T01:00:00Z")).toBe(6);
  });

  it("handles UTC date that is different day in JST", () => {
    // 2026-04-06 Mon 23:00 UTC = 2026-04-07 Tue 08:00 JST
    expect(getJstDayOfWeek("2026-04-06T23:00:00Z")).toBe(1);
  });
});

describe("formatJstDate", () => {
  it("formats as M/D in JST", () => {
    // 2026-04-03 Fri 10:00 JST = 2026-04-03 01:00 UTC
    expect(formatJstDate("2026-04-03T01:00:00Z")).toBe("4/3");
  });

  it("handles UTC-to-JST date boundary", () => {
    // 2026-04-03 23:00 UTC = 2026-04-04 08:00 JST
    expect(formatJstDate("2026-04-03T23:00:00Z")).toBe("4/4");
  });
});

describe("getJstMondayUtc", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns Monday 00:00 JST as UTC ISO string", () => {
    // 2026-04-03 Fri 12:00 JST = 2026-04-03 03:00 UTC
    vi.setSystemTime(new Date("2026-04-03T03:00:00Z"));
    const monday = getJstMondayUtc();
    // Monday 2026-03-30 00:00 JST = 2026-03-29 15:00 UTC
    expect(monday).toBe("2026-03-29T15:00:00.000Z");
  });

  it("returns same Monday when called on Monday JST", () => {
    // 2026-03-30 Mon 10:00 JST = 2026-03-30 01:00 UTC
    vi.setSystemTime(new Date("2026-03-30T01:00:00Z"));
    const monday = getJstMondayUtc();
    expect(monday).toBe("2026-03-29T15:00:00.000Z");
  });

  it("returns correct Monday when Sunday JST", () => {
    // 2026-04-05 Sun 10:00 JST = 2026-04-05 01:00 UTC
    vi.setSystemTime(new Date("2026-04-05T01:00:00Z"));
    const monday = getJstMondayUtc();
    // Monday 2026-03-30 00:00 JST = 2026-03-29 15:00 UTC
    expect(monday).toBe("2026-03-29T15:00:00.000Z");
  });
});
