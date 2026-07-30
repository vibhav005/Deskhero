import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { todayInTimezone, currentHourInTimezone, isoDayOfWeek, currentWeekStartInTimezone } from "./tz";

describe("tz", () => {
  beforeEach(() => {
    // Fixed instant near a UTC day boundary so timezone differences actually
    // cross a calendar day — exactly the case daily_plans.plan_date depends on.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T23:30:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes today's date correctly per timezone, including across the UTC day boundary", () => {
    // Etc/GMT+12 is a fixed UTC-12 offset (no DST) — still the 15th locally.
    expect(todayInTimezone("Etc/GMT+12")).toBe("2026-01-15");
    // Pacific/Kiritimati is a fixed UTC+14 offset — already the 16th locally.
    expect(todayInTimezone("Pacific/Kiritimati")).toBe("2026-01-16");
  });

  it("falls back to UTC for an invalid timezone instead of throwing", () => {
    expect(() => todayInTimezone("Not/A_Real_Zone")).not.toThrow();
    expect(todayInTimezone("Not/A_Real_Zone")).toBe("2026-01-15");
  });

  it("computes the local hour correctly per timezone", () => {
    expect(currentHourInTimezone("Etc/GMT+12")).toBe(11);
    expect(currentHourInTimezone("Pacific/Kiritimati")).toBe(13);
  });

  it("falls back to UTC hour for an invalid timezone instead of throwing", () => {
    expect(currentHourInTimezone("Not/A_Real_Zone")).toBe(23);
  });

  it("computes ISO day-of-week (0=Monday..6=Sunday) correctly", () => {
    expect(isoDayOfWeek("2026-01-12")).toBe(0); // Monday
    expect(isoDayOfWeek("2026-01-15")).toBe(3); // Thursday
    expect(isoDayOfWeek("2026-01-18")).toBe(6); // Sunday
  });

  it("computes the current week's Monday per timezone", () => {
    // 2026-01-15 (Etc/GMT+12) and 2026-01-16 (Pacific/Kiritimati) are both in the same ISO week.
    expect(currentWeekStartInTimezone("Etc/GMT+12")).toBe("2026-01-12");
    expect(currentWeekStartInTimezone("Pacific/Kiritimati")).toBe("2026-01-12");
  });
});
