import { currentHourInTimezone } from "@/lib/tz";
import type { Database } from "@/types/database";

type Activity = Database["public"]["Tables"]["activities"]["Row"];

export const COUNT_BY_ACTIVITY_LEVEL: Record<string, number> = {
  inactive: 3,
  light: 4,
  moderate: 5,
};

const GOAL_PRIORITY: Record<string, string[]> = {
  energy: ["walking", "mobility", "hydration", "breathing"],
  posture: ["posture", "mobility", "eye-care", "breathing"],
  strength: ["strength", "mobility", "posture", "walking"],
  flexibility: ["mobility", "posture", "breathing", "walking"],
  sleep: ["breathing", "walking", "sleep", "mobility"],
  general: ["hydration", "posture", "walking", "mobility"],
};

const PREF_BOOST: Record<string, string[]> = {
  walking: ["walking"],
  stretching: ["mobility", "posture"],
  strength: ["strength"],
  breathing: ["breathing", "sleep"],
  mixed: [],
};

const INACTIVE_FOCUS = ["walking", "mobility", "hydration", "posture"];

const TIME_OF_DAY_CATEGORIES: { start: number; end: number; categories: string[] }[] = [
  { start: 5, end: 11, categories: ["breathing", "hydration"] },
  { start: 11, end: 17, categories: ["walking", "mobility"] },
  { start: 17, end: 24, categories: ["sleep", "posture"] },
];

export interface UserContext {
  userId: string;
  timezone: string;
  activityLevel: string;
  goal: string;
  activityPreference: string;
  sessionDuration: number;
  limitationTags: string[];
}

export interface SelectionParams extends UserContext {
  activities: Activity[];
  skipCounts: Map<string, { within7: number; within14: number }>;
  count: number;
  forceEasyOnly: boolean;
  allowChallenging: boolean;
  excludeActivityIds?: Set<string>;
  excludeCategories?: Set<string>;
}

/**
 * Score + greedily select activities. Shared by initial daily-plan
 * generation, "make today easier," and single-quest replace — the same
 * scoring rules apply to a brand-new plan or a one-off swap.
 */
export function selectActivities(params: SelectionParams): Activity[] {
  const {
    activities,
    activityLevel,
    goal,
    activityPreference,
    sessionDuration,
    limitationTags,
    timezone,
    skipCounts,
    count,
    forceEasyOnly,
    allowChallenging,
    excludeActivityIds,
    excludeCategories,
  } = params;

  const maxPerQuestMinutes = sessionDuration;
  // Deliberately more than a flat 1.5x: the per-quest cap already allows a
  // single quest to consume the whole sessionDuration, so a tight whole-plan
  // cap could leave zero room for the remaining slots after just one or two
  // picks — undershooting `count` even when plenty of short activities exist.
  const maxPlanMinutes = sessionDuration * 2.5;
  const hour = currentHourInTimezone(timezone);
  const timeCategories =
    TIME_OF_DAY_CATEGORIES.find((t) => hour >= t.start && hour < t.end)?.categories ?? [];

  const priorityList = Array.from(
    new Set([
      ...(activityLevel === "inactive" ? INACTIVE_FOCUS : []),
      ...(GOAL_PRIORITY[goal] ?? []),
      ...(PREF_BOOST[activityPreference] ?? []),
    ]),
  );

  let pool = activities.filter((a) => {
    if (excludeActivityIds?.has(a.id)) return false;
    if (a.minutes > maxPerQuestMinutes) return false;
    if (limitationTags.length > 0 && a.contraindicated_tags.some((t) => limitationTags.includes(t))) {
      return false;
    }
    if (activityLevel === "inactive" && a.difficulty === "challenging") return false;
    if (forceEasyOnly && a.difficulty !== "easy") return false;
    if (!allowChallenging && a.difficulty === "challenging") return false;
    return true;
  });
  if (pool.length === 0) pool = activities.filter((a) => a.minutes <= maxPerQuestMinutes);

  const scored = pool
    .map((activity) => {
      let score = 0;
      const idx = priorityList.indexOf(activity.category);
      if (idx !== -1) score += (priorityList.length - idx) * 10;
      if (activity.difficulty === "easy") score += 3;
      if (activity.category === "hydration") score += 4;
      if (timeCategories.includes(activity.category)) score += 5;
      const skips = skipCounts.get(activity.id);
      if (skips) score -= skips.within7 * 8 + skips.within14 * 3;
      return { activity, score };
    })
    .sort((a, b) => b.score - a.score);

  const chosen: Activity[] = [];
  const usedCategories = new Set<string>(excludeCategories ?? []);
  let totalMinutes = 0;

  for (const { activity } of scored) {
    if (chosen.length >= count) break;
    if (usedCategories.has(activity.category)) continue;
    if (chosen.length > 0 && totalMinutes + activity.minutes > maxPlanMinutes) continue;
    chosen.push(activity);
    usedCategories.add(activity.category);
    totalMinutes += activity.minutes;
  }
  for (const { activity } of scored) {
    if (chosen.length >= count) break;
    if (chosen.some((c) => c.id === activity.id)) continue;
    if (chosen.length > 0 && totalMinutes + activity.minutes > maxPlanMinutes) continue;
    chosen.push(activity);
    totalMinutes += activity.minutes;
  }

  // Guarantee at least one very-easy quest in a fresh plan (not applicable to single-quest replace).
  if (count > 1) {
    const hasVeryEasy = chosen.some((a) => a.difficulty === "easy" && a.minutes <= 2);
    if (!hasVeryEasy) {
      const veryEasy = scored.find(
        ({ activity }) => activity.difficulty === "easy" && activity.minutes <= 2 && !chosen.some((c) => c.id === activity.id),
      );
      if (veryEasy && chosen.length > 0) chosen[chosen.length - 1] = veryEasy.activity;
    }
  }

  return chosen;
}
