import { describe, it, expect } from "vitest";
import { levelForXp } from "./logic";

describe("levelForXp", () => {
  it("starts at level 1 with zero progress at 0 XP", () => {
    const result = levelForXp(0);
    expect(result.level).toBe(1);
    expect(result.name).toBe("Desk Survivor");
    expect(result.progress).toBe(0);
  });

  it("levels up exactly at a threshold", () => {
    const result = levelForXp(120);
    expect(result.level).toBe(2);
    expect(result.name).toBe("Movement Rookie");
  });

  it("reports partial progress toward the next level", () => {
    const result = levelForXp(180); // 120 -> 300 span, 60/180 in
    expect(result.level).toBe(2);
    expect(result.progress).toBeGreaterThan(0);
    expect(result.progress).toBeLessThan(1);
  });

  it("caps out at the max level with full progress and no next level", () => {
    const result = levelForXp(5000);
    expect(result.level).toBe(7);
    expect(result.name).toBe("Desk Hero");
    expect(result.next).toBeNull();
    expect(result.progress).toBe(1);
  });
});
