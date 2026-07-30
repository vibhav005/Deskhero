import { currentHourInTimezone } from "@/lib/tz";
import type { Database } from "@/types/database";

type Activity = Database["public"]["Tables"]["activities"]["Row"];

export const COUNT_BY_ACTIVITY_LEVEL: Record<string, number> = {
  inactive: 3,
  light: 4,
  moderate: 5,
};

export const GOAL_PRIORITY: Record<string, string[]> = {
  energy: ["walking", "mobility", "hydration", "breathing"],
  posture: ["posture", "mobility", "eye-care", "breathing"],
  strength: ["strength", "mobility", "posture", "walking"],
  flexibility: ["mobility", "posture", "breathing", "walking"],
  sleep: ["breathing", "walking", "sleep", "mobility"],
  general: ["hydration", "posture", "walking", "mobility"],
};

export const PREF_BOOST: Record<string, string[]> = {
  walking: ["walking"],
  stretching: ["mobility", "posture"],
  strength: ["strength"],
  breathing: ["breathing", "sleep"],
  mixed: [],
};

export const INACTIVE_FOCUS = ["walking", "mobility", "hydration", "posture"];

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

/** Named components of a candidate's score — persisted so recommendations stay explainable. */
export interface ScoreFactors {
  category_priority: number;
  difficulty_ease: number;
  hydration_boost: number;
  time_of_day: number;
  skip_penalty: number;
}

export interface ScoredActivity {
  activity: Activity;
  totalScore: number;
  factors: ScoreFactors;
}

/**
 * Score + greedily select activities. Shared by initial daily-plan
 * generation, "make today easier," and single-quest replace — the same
 * scoring rules apply to a brand-new plan or a one-off swap.
 *
 * Returns the chosen activities together with the exact factor breakdown
 * that produced their score, so callers can persist a faithful "why this was
 * recommended" record instead of recomputing (and potentially drifting from)
 * the explanation later.
 */
export function selectActivities(params: SelectionParams): ScoredActivity[] {
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

  const scored: ScoredActivity[] = pool
    .map((activity) => {
      const idx = priorityList.indexOf(activity.category);
      const factors: ScoreFactors = {
        category_priority: idx !== -1 ? (priorityList.length - idx) * 10 : 0,
        difficulty_ease: activity.difficulty === "easy" ? 3 : 0,
        hydration_boost: activity.category === "hydration" ? 4 : 0,
        time_of_day: timeCategories.includes(activity.category) ? 5 : 0,
        skip_penalty: 0,
      };
      const skips = skipCounts.get(activity.id);
      if (skips) factors.skip_penalty = -(skips.within7 * 8 + skips.within14 * 3);
      const totalScore =
        factors.category_priority +
        factors.difficulty_ease +
        factors.hydration_boost +
        factors.time_of_day +
        factors.skip_penalty;
      return { activity, totalScore, factors };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  const chosen: ScoredActivity[] = [];
  const usedCategories = new Set<string>(excludeCategories ?? []);
  let totalMinutes = 0;

  for (const entry of scored) {
    if (chosen.length >= count) break;
    if (usedCategories.has(entry.activity.category)) continue;
    if (chosen.length > 0 && totalMinutes + entry.activity.minutes > maxPlanMinutes) continue;
    chosen.push(entry);
    usedCategories.add(entry.activity.category);
    totalMinutes += entry.activity.minutes;
  }
  for (const entry of scored) {
    if (chosen.length >= count) break;
    if (chosen.some((c) => c.activity.id === entry.activity.id)) continue;
    if (chosen.length > 0 && totalMinutes + entry.activity.minutes > maxPlanMinutes) continue;
    chosen.push(entry);
    totalMinutes += entry.activity.minutes;
  }

  // Guarantee at least one very-easy quest in a fresh plan (not applicable to single-quest replace).
  if (count > 1) {
    const hasVeryEasy = chosen.some((c) => c.activity.difficulty === "easy" && c.activity.minutes <= 2);
    if (!hasVeryEasy) {
      const veryEasy = scored.find(
        (entry) =>
          entry.activity.difficulty === "easy" &&
          entry.activity.minutes <= 2 &&
          !chosen.some((c) => c.activity.id === entry.activity.id),
      );
      if (veryEasy && chosen.length > 0) chosen[chosen.length - 1] = veryEasy;
    }
  }

  return chosen;
}
