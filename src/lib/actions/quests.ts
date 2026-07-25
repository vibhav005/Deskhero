"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayInTimezone, currentHourInTimezone } from "@/lib/tz";
import {
  completeQuestSchema,
  dailyQuestIdSchema,
  type CompleteQuestInput,
  type DailyQuestIdInput,
} from "@/lib/validation/quests.schema";
import type { Database } from "@/types/database";

type Activity = Database["public"]["Tables"]["activities"]["Row"];

export interface ActionResult {
  ok: boolean;
  message?: string;
}

const COUNT_BY_ACTIVITY_LEVEL: Record<string, number> = {
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

interface UserContext {
  userId: string;
  timezone: string;
  activityLevel: string;
  goal: string;
  activityPreference: string;
  sessionDuration: number;
  limitationTags: string[];
}

async function loadUserContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<UserContext | null> {
  const [{ data: profile }, { data: prefs }] = await Promise.all([
    supabase.from("profiles").select("timezone").eq("id", userId).single(),
    supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  if (!profile) return null;

  return {
    userId,
    timezone: profile.timezone,
    activityLevel: prefs?.activity_level ?? "light",
    goal: prefs?.goal ?? "general",
    activityPreference: prefs?.activity_preference ?? "mixed",
    sessionDuration: prefs?.session_duration ?? 10,
    limitationTags: prefs?.limitation_tags ?? [],
  };
}

/** Skip counts (last 7d / 14d) per activity, and rolling weekly/two-week consistency fractions (0..1). */
async function loadHistorySignals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const since14Date = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);

  const { data: recentPlans } = await supabase
    .from("daily_plans")
    .select("id, plan_date")
    .eq("user_id", userId)
    .gte("plan_date", since14Date);

  const planDateById = new Map((recentPlans ?? []).map((p) => [p.id, p.plan_date]));
  const recentPlanIds = (recentPlans ?? []).map((p) => p.id);

  let skippedRows: { activity_id: string; daily_plan_id: string }[] = [];
  if (recentPlanIds.length > 0) {
    const { data } = await supabase
      .from("daily_quests")
      .select("activity_id, daily_plan_id")
      .in("daily_plan_id", recentPlanIds)
      .eq("status", "skipped");
    skippedRows = data ?? [];
  }

  const skipCounts = new Map<string, { within7: number; within14: number }>();
  for (const row of skippedRows) {
    const planDateStr = planDateById.get(row.daily_plan_id);
    if (!planDateStr) continue;
    const daysAgo = (Date.now() - new Date(planDateStr).getTime()) / 86400000;
    const entry = skipCounts.get(row.activity_id) ?? { within7: 0, within14: 0 };
    if (daysAgo <= 7) entry.within7 += 1;
    if (daysAgo <= 14) entry.within14 += 1;
    skipCounts.set(row.activity_id, entry);
  }

  const since7 = new Date(Date.now() - 7 * 86400000).toISOString();
  const since14 = new Date(Date.now() - 14 * 86400000).toISOString();
  const { data: completions14 } = await supabase
    .from("quest_completions")
    .select("completed_at")
    .eq("user_id", userId)
    .gte("completed_at", since14);

  const days7 = new Set<string>();
  const days14 = new Set<string>();
  for (const c of completions14 ?? []) {
    const day = c.completed_at.slice(0, 10);
    days14.add(day);
    if (c.completed_at >= since7) days7.add(day);
  }

  return {
    skipCounts,
    weeklyConsistency: days7.size / 7,
    twoWeekConsistency: days14.size / 14,
    // No plan in the last 14 days means this is a brand-new (or long-lapsed)
    // user — nothing to judge consistency from yet, so the low-consistency
    // de-escalation shouldn't fire on day one and label a fresh start "recovery."
    hasRecentHistory: recentPlanIds.length > 0,
  };
}

interface SelectionParams extends UserContext {
  activities: Activity[];
  skipCounts: Map<string, { within7: number; within14: number }>;
  count: number;
  forceEasyOnly: boolean;
  allowChallenging: boolean;
  excludeActivityIds?: Set<string>;
  excludeCategories?: Set<string>;
}

/** Score + greedily select activities. Shared by initial generation, "make easier," and single-quest replace. */
function selectActivities(params: SelectionParams): Activity[] {
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

/**
 * Generates (or, with `easier: true`, regenerates the still-uncompleted
 * portion of) today's plan. Idempotent: a plan already exists for
 * (user, plan_date) is left untouched unless `easier` is set.
 */
export async function generateDailyPlan(
  options: { easier?: boolean } = {},
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const ctx = await loadUserContext(supabase, user.id);
  if (!ctx) return { ok: false, message: "Profile not found." };

  const planDate = todayInTimezone(ctx.timezone);

  const { data: existingPlan } = await supabase
    .from("daily_plans")
    .select("*, daily_quests(*)")
    .eq("user_id", user.id)
    .eq("plan_date", planDate)
    .maybeSingle();

  if (existingPlan && !options.easier) {
    return { ok: true };
  }

  const { data: activities } = await supabase.from("activities").select("*").eq("is_active", true);
  if (!activities || activities.length === 0) {
    return { ok: false, message: "No activities available yet." };
  }

  const { skipCounts, weeklyConsistency, twoWeekConsistency, hasRecentHistory } =
    await loadHistorySignals(supabase, user.id);
  const allowChallenging = hasRecentHistory && twoWeekConsistency >= 0.8;
  const strugglingConsistency = hasRecentHistory && weeklyConsistency < 0.4;
  const forceEasyOnly = strugglingConsistency || Boolean(options.easier);

  let count = COUNT_BY_ACTIVITY_LEVEL[ctx.activityLevel] ?? 4;
  if (strugglingConsistency && !options.easier) count = Math.max(3, count - 1);
  if (options.easier) count = Math.max(3, count - 1);

  if (options.easier && existingPlan) {
    const existingQuests = existingPlan.daily_quests ?? [];
    const completedActivityIds = new Set(
      existingQuests.filter((q) => q.status === "completed").map((q) => q.activity_id),
    );
    const completedCategories = new Set(
      activities
        .filter((a) => completedActivityIds.has(a.id))
        .map((a) => a.category),
    );

    const chosen = selectActivities({
      ...ctx,
      activities,
      skipCounts,
      count,
      forceEasyOnly: true,
      allowChallenging: false,
      excludeActivityIds: completedActivityIds,
      excludeCategories: completedCategories,
    });

    await supabase
      .from("daily_quests")
      .delete()
      .eq("daily_plan_id", existingPlan.id)
      .eq("status", "assigned");

    const startPosition = existingQuests.filter((q) => q.status === "completed").length;
    const rows = chosen.map((a, i) => ({
      daily_plan_id: existingPlan.id,
      user_id: user.id,
      activity_id: a.id,
      position: startPosition + i,
      assigned_reason: "easier",
    }));
    if (rows.length > 0) {
      const { error } = await supabase.from("daily_quests").insert(rows);
      if (error) return { ok: false, message: error.message };
    }
    await supabase
      .from("daily_plans")
      .update({ generated_reason: "easier", quest_count: startPosition + rows.length })
      .eq("id", existingPlan.id);

    revalidatePath("/dashboard");
    return { ok: true };
  }

  const chosen = selectActivities({
    ...ctx,
    activities,
    skipCounts,
    count,
    forceEasyOnly,
    allowChallenging,
  });
  if (chosen.length === 0) return { ok: false, message: "Could not build a plan from the available activities." };

  const { data: newPlan, error: planError } = await supabase
    .from("daily_plans")
    .insert({
      user_id: user.id,
      plan_date: planDate,
      timezone_snapshot: ctx.timezone,
      quest_count: chosen.length,
      generated_reason: forceEasyOnly ? "recovery" : "standard",
    })
    .select()
    .single();
  if (planError || !newPlan) {
    return { ok: false, message: planError?.message ?? "Could not create today's plan." };
  }

  const rows = chosen.map((a, i) => ({
    daily_plan_id: newPlan.id,
    user_id: user.id,
    activity_id: a.id,
    position: i,
    assigned_reason: forceEasyOnly ? "recovery" : "standard",
  }));
  const { error: questsError } = await supabase.from("daily_quests").insert(rows);
  if (questsError) return { ok: false, message: questsError.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function makeTodayEasier(): Promise<ActionResult> {
  return generateDailyPlan({ easier: true });
}

/** Calls the idempotent SECURITY DEFINER RPC — the only path XP/completion state can change through. */
export async function completeQuest(input: CompleteQuestInput): Promise<ActionResult> {
  const parsed = completeQuestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const { data, error } = await supabase.rpc("complete_activity_and_award_xp", {
    p_user_id: user.id,
    p_daily_quest_id: parsed.data.dailyQuestId,
    p_notes: parsed.data.notes ?? undefined,
  });
  if (error) return { ok: false, message: error.message };

  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.completed) {
    return { ok: false, message: "That quest was already completed or isn't available anymore." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/achievements");
  revalidatePath("/progress");
  return { ok: true };
}

export async function skipQuest(input: DailyQuestIdInput): Promise<ActionResult> {
  const parsed = dailyQuestIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const { error } = await supabase
    .from("daily_quests")
    .update({ status: "skipped" })
    .eq("id", parsed.data.dailyQuestId)
    .eq("user_id", user.id)
    .eq("status", "assigned");
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function replaceQuest(input: DailyQuestIdInput): Promise<ActionResult> {
  const parsed = dailyQuestIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const { data: dailyQuest } = await supabase
    .from("daily_quests")
    .select("*, daily_plans!inner(id)")
    .eq("id", parsed.data.dailyQuestId)
    .eq("user_id", user.id)
    .eq("status", "assigned")
    .maybeSingle();
  if (!dailyQuest) return { ok: false, message: "That quest can't be replaced right now." };

  const { data: planQuests } = await supabase
    .from("daily_quests")
    .select("activity_id")
    .eq("daily_plan_id", dailyQuest.daily_plan_id);

  const ctx = await loadUserContext(supabase, user.id);
  if (!ctx) return { ok: false, message: "Profile not found." };

  const { data: activities } = await supabase.from("activities").select("*").eq("is_active", true);
  if (!activities) return { ok: false, message: "No activities available." };

  const { skipCounts, twoWeekConsistency } = await loadHistorySignals(supabase, user.id);
  const usedActivityIds = new Set((planQuests ?? []).map((q) => q.activity_id));
  const usedCategories = new Set(
    activities.filter((a) => usedActivityIds.has(a.id)).map((a) => a.category),
  );

  const [replacement] = selectActivities({
    ...ctx,
    activities,
    skipCounts,
    count: 1,
    forceEasyOnly: false,
    allowChallenging: twoWeekConsistency >= 0.8,
    excludeActivityIds: usedActivityIds,
    excludeCategories: usedCategories,
  });
  if (!replacement) return { ok: false, message: "No suitable replacement available right now." };

  const { error } = await supabase
    .from("daily_quests")
    .update({ activity_id: replacement.id, assigned_reason: "replaced" })
    .eq("id", parsed.data.dailyQuestId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}
