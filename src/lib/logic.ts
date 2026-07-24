import { ACHIEVEMENTS, LEVELS, QUESTS } from "./data";
import type {
  Achievement,
  AppState,
  DayRecord,
  Quest,
  QuestCategory,
  Stats,
  UserProfile,
} from "./types";
import { clamp } from "./utils";

// ---------------------------------------------------------------------------
// Leveling
// ---------------------------------------------------------------------------
export function levelForXp(xp: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.minXp) current = l;
  }
  const next = LEVELS.find((l) => l.minXp > xp) ?? null;
  const spanStart = current.minXp;
  const spanEnd = next ? next.minXp : current.minXp;
  const intoLevel = xp - spanStart;
  const levelSpan = next ? spanEnd - spanStart : 1;
  const progress = next ? clamp(intoLevel / levelSpan, 0, 1) : 1;
  return {
    level: current.level,
    name: current.name,
    next,
    xpIntoLevel: intoLevel,
    xpForNext: next ? spanEnd - xp : 0,
    progress,
  };
}

// ---------------------------------------------------------------------------
// Personalised quest assignment (simple rule-based logic)
// ---------------------------------------------------------------------------
export function assignDailyQuests(profile: UserProfile): string[] {
  const pool = [...QUESTS];

  // How many quests to assign, based on activity level.
  const count =
    profile.activityLevel === "inactive"
      ? 3
      : profile.activityLevel === "light"
        ? 4
        : 5;

  // Never assign anything longer than the user's realistic session budget.
  const maxMinutes = profile.sessionDuration;

  // Category priorities by goal.
  const goalPriority: Record<UserProfile["goal"], QuestCategory[]> = {
    energy: ["walking", "mobility", "hydration", "breathing"],
    posture: ["posture", "mobility", "eye-care", "breathing"],
    strength: ["strength", "mobility", "posture", "walking"],
    flexibility: ["mobility", "posture", "breathing", "walking"],
    sleep: ["breathing", "walking", "sleep", "mobility"],
    general: ["hydration", "posture", "walking", "mobility"],
  };

  // Preference nudges.
  const prefBoost: Record<UserProfile["activityPreference"], QuestCategory[]> = {
    walking: ["walking"],
    stretching: ["mobility", "posture"],
    strength: ["strength"],
    breathing: ["breathing", "sleep"],
    mixed: [],
  };

  // Inactive users get short, gentle categories prioritised.
  const inactiveFocus: QuestCategory[] = [
    "walking",
    "mobility",
    "hydration",
    "posture",
  ];

  const priorities = new Set<QuestCategory>([
    ...(profile.activityLevel === "inactive" ? inactiveFocus : []),
    ...goalPriority[profile.goal],
    ...prefBoost[profile.activityPreference],
  ]);

  // Score each quest: higher is better.
  const scored = pool
    .filter((q) => q.minutes <= maxMinutes)
    // Inactive users avoid the most challenging quests.
    .filter((q) =>
      profile.activityLevel === "inactive" ? q.difficulty !== "challenging" : true,
    )
    .map((q) => {
      let score = 0;
      const priorityList = Array.from(priorities);
      const idx = priorityList.indexOf(q.category);
      if (idx !== -1) score += (priorityList.length - idx) * 10;
      if (q.difficulty === "easy") score += 3;
      // Always keep an easy hydration and an eye break available.
      if (q.category === "hydration") score += 4;
      return { q, score };
    })
    .sort((a, b) => b.score - a.score);

  const chosen: Quest[] = [];
  const usedCategories = new Set<QuestCategory>();

  // First pass: variety — one quest per category.
  for (const { q } of scored) {
    if (chosen.length >= count) break;
    if (usedCategories.has(q.category)) continue;
    chosen.push(q);
    usedCategories.add(q.category);
  }
  // Second pass: fill remaining slots if variety ran out.
  for (const { q } of scored) {
    if (chosen.length >= count) break;
    if (chosen.some((c) => c.id === q.id)) continue;
    chosen.push(q);
  }

  return chosen.map((q) => q.id);
}

// ---------------------------------------------------------------------------
// Daily health score (0–100) from today's completion.
// ---------------------------------------------------------------------------
export function dailyScore(completed: number, assigned: number): number {
  if (assigned <= 0) return 0;
  return Math.round(clamp(completed / assigned, 0, 1) * 100);
}

// ---------------------------------------------------------------------------
// Weekly consistency: share of the last 7 days with at least one quest done.
// ---------------------------------------------------------------------------
export function weeklyConsistency(history: DayRecord[], todayDone: boolean): number {
  const lastSix = history.slice(-6);
  const activeDays =
    lastSix.filter((d) => d.completedQuestIds.length > 0).length +
    (todayDone ? 1 : 0);
  return Math.round((activeDays / 7) * 100);
}

// ---------------------------------------------------------------------------
// Achievement progress
// ---------------------------------------------------------------------------
export function achievementProgress(
  a: Achievement,
  stats: Stats,
  history: DayRecord[],
): number {
  switch (a.metric) {
    case "questsCompleted":
      return stats.questsCompleted;
    case "hydrationCompleted":
      return stats.hydrationCompleted;
    case "walksCompleted":
      return stats.walksCompleted;
    case "postureCompleted":
      return stats.postureCompleted;
    case "workoutsCompleted":
      return stats.workoutsCompleted;
    case "mobilityCompleted":
      return stats.mobilityCompleted;
    case "bestStreak":
      return stats.bestStreak;
    case "daysActive":
      return history.filter((d) => d.completedQuestIds.length > 0).length;
    default:
      return 0;
  }
}

export function computeUnlocked(state: AppState): string[] {
  return ACHIEVEMENTS.filter(
    (a) => achievementProgress(a, state.stats, state.history) >= a.target,
  ).map((a) => a.id);
}

// ---------------------------------------------------------------------------
// Stat bucket updates when a quest is completed.
// ---------------------------------------------------------------------------
export function applyStatDelta(stats: Stats, quest: Quest): Stats {
  const next: Stats = { ...stats };
  next.questsCompleted += 1;
  switch (quest.category) {
    case "hydration":
      next.hydrationCompleted += 1;
      break;
    case "walking":
      next.walksCompleted += 1;
      break;
    case "posture":
      next.postureCompleted += 1;
      break;
    case "mobility":
      next.mobilityCompleted += 1;
      next.movementBreaks += 1;
      break;
    case "strength":
      next.workoutsCompleted += 1;
      break;
    default:
      break;
  }
  if (quest.workout) next.workoutsCompleted += 1;
  if (quest.category === "mobility" || quest.category === "posture") {
    next.movementBreaks += 1;
  }
  return next;
}
