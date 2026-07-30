import { describe, it, expect } from "vitest";
import { selectActivities, type SelectionParams } from "./quest-engine";
import type { Database } from "@/types/database";

type Activity = Database["public"]["Tables"]["activities"]["Row"];

function makeActivity(overrides: Partial<Activity> & Pick<Activity, "id" | "category">): Activity {
  return {
    slug: overrides.id,
    title: overrides.id,
    difficulty: "easy",
    minutes: 5,
    xp_value: 10,
    position: "either",
    equipment_free: true,
    summary: "test activity",
    instructions: [],
    safety_notes: null,
    easier_alternative: null,
    timer_seconds: null,
    workout_id: null,
    contraindicated_tags: [],
    is_active: true,
    created_by: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as Activity;
}

const baseParams: Omit<SelectionParams, "activities" | "count"> = {
  userId: "u1",
  timezone: "UTC",
  activityLevel: "light",
  goal: "general",
  activityPreference: "mixed",
  sessionDuration: 10,
  limitationTags: [],
  skipCounts: new Map(),
  forceEasyOnly: false,
  allowChallenging: false,
};

describe("selectActivities", () => {
  it("fills the requested count when enough distinct-category activities fit the plan budget", () => {
    // Regression test: sessionDuration=10 previously produced maxPlanMinutes=15
    // (1.5x), which two 5-8min quests could exhaust, leaving no room for a
    // 3rd even though eligible activities existed. The fix widened this to
    // 2.5x (25min budget here), which comfortably fits 3.
    const activities = [
      makeActivity({ id: "a1", category: "hydration", minutes: 1 }),
      makeActivity({ id: "a2", category: "posture", minutes: 3 }),
      makeActivity({ id: "a3", category: "walking", minutes: 10 }),
      makeActivity({ id: "a4", category: "mobility", minutes: 5 }),
    ];
    const result = selectActivities({ ...baseParams, activities, count: 3 });
    expect(result).toHaveLength(3);
  });

  it("never selects an activity whose contraindicated tags match the user's limitations", () => {
    const activities = [
      makeActivity({ id: "safe", category: "mobility" }),
      makeActivity({ id: "risky", category: "strength", contraindicated_tags: ["knee"] }),
    ];
    const result = selectActivities({
      ...baseParams,
      activities,
      count: 2,
      limitationTags: ["knee"],
    });
    expect(result.map((r) => r.activity.id)).not.toContain("risky");
  });

  it("only returns easy activities when forceEasyOnly is set", () => {
    const activities = [
      makeActivity({ id: "e1", category: "hydration", difficulty: "easy" }),
      makeActivity({ id: "m1", category: "posture", difficulty: "moderate" }),
      makeActivity({ id: "c1", category: "strength", difficulty: "challenging" }),
    ];
    const result = selectActivities({
      ...baseParams,
      activities,
      count: 3,
      forceEasyOnly: true,
    });
    expect(result.every((r) => r.activity.difficulty === "easy")).toBe(true);
  });

  it("excludes challenging activities when allowChallenging is false", () => {
    const activities = [
      makeActivity({ id: "e1", category: "hydration", difficulty: "easy" }),
      makeActivity({ id: "c1", category: "strength", difficulty: "challenging" }),
    ];
    const result = selectActivities({
      ...baseParams,
      activities,
      count: 2,
      allowChallenging: false,
    });
    expect(result.map((r) => r.activity.id)).not.toContain("c1");
  });

  it("includes challenging activities when allowChallenging is true", () => {
    const activities = [makeActivity({ id: "c1", category: "strength", difficulty: "challenging" })];
    const result = selectActivities({
      ...baseParams,
      activities,
      count: 1,
      allowChallenging: true,
    });
    expect(result.map((r) => r.activity.id)).toContain("c1");
  });

  it("respects excludeActivityIds and excludeCategories (used by single-quest replace)", () => {
    const activities = [
      makeActivity({ id: "used", category: "walking" }),
      makeActivity({ id: "also-walking", category: "walking" }),
      makeActivity({ id: "fresh", category: "posture" }),
    ];
    const result = selectActivities({
      ...baseParams,
      activities,
      count: 1,
      excludeActivityIds: new Set(["used"]),
      excludeCategories: new Set(["walking"]),
    });
    expect(result).toHaveLength(1);
    expect(result[0].activity.id).toBe("fresh");
  });

  it("guarantees at least one very-easy quest in a multi-quest plan when one is available", () => {
    const activities = [
      makeActivity({ id: "hard1", category: "strength", difficulty: "moderate", minutes: 10 }),
      makeActivity({ id: "hard2", category: "posture", difficulty: "moderate", minutes: 10 }),
      // Deliberately the lowest-scoring category so it wouldn't naturally be picked.
      makeActivity({ id: "tiny", category: "sleep", difficulty: "easy", minutes: 1 }),
    ];
    const result = selectActivities({ ...baseParams, activities, count: 2 });
    expect(result.some((r) => r.activity.difficulty === "easy" && r.activity.minutes <= 2)).toBe(true);
  });

  it("does not pick two activities from the same category when alternatives exist", () => {
    const activities = [
      makeActivity({ id: "walk1", category: "walking" }),
      makeActivity({ id: "walk2", category: "walking" }),
      makeActivity({ id: "posture1", category: "posture" }),
    ];
    const result = selectActivities({ ...baseParams, activities, count: 2 });
    const categories = result.map((r) => r.activity.category);
    expect(new Set(categories).size).toBe(categories.length);
  });

  it("reports a factor breakdown whose sum equals the total score", () => {
    const activities = [makeActivity({ id: "a1", category: "hydration", difficulty: "easy" })];
    const result = selectActivities({ ...baseParams, activities, count: 1 });
    const { totalScore, factors } = result[0];
    const sum = Object.values(factors).reduce((acc, v) => acc + v, 0);
    expect(sum).toBe(totalScore);
  });
});
