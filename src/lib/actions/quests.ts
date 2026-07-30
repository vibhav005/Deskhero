"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/actions/analytics";
import { todayInTimezone } from "@/lib/tz";
import {
  COUNT_BY_ACTIVITY_LEVEL,
  selectActivities,
  type ScoredActivity,
  type UserContext,
} from "@/lib/quest-engine";
import { buildExplanations } from "@/lib/recommendation-explain";
import {
  completeQuestSchema,
  dailyQuestIdSchema,
  type CompleteQuestInput,
  type DailyQuestIdInput,
} from "@/lib/validation/quests.schema";

export interface ActionResult {
  ok: boolean;
  message?: string;
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

/**
 * Persists the exact factor breakdown that produced a recommendation, plus
 * deterministic explanation lines derived from it — best-effort, mirroring
 * trackEvent's "never break the caller" swallow-errors convention, since this
 * is an explanatory record, not reward logic.
 */
async function persistRecommendation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    dailyQuestId: string;
    userId: string;
    scored: ScoredActivity;
    context: Pick<UserContext, "goal" | "activityPreference" | "activityLevel">;
  },
): Promise<void> {
  const { dailyQuestId, userId, scored, context } = params;
  try {
    const { data: scoreRow } = await supabase
      .from("recommendation_scores")
      .upsert(
        {
          daily_quest_id: dailyQuestId,
          user_id: userId,
          activity_id: scored.activity.id,
          total_score: scored.totalScore,
          factors: { ...scored.factors } as unknown as Record<string, number>,
        },
        { onConflict: "daily_quest_id" },
      )
      .select()
      .single();
    if (!scoreRow) return;

    await supabase.from("recommendation_explanations").delete().eq("recommendation_score_id", scoreRow.id);

    const explanations = buildExplanations(scored.factors, {
      category: scored.activity.category,
      goal: context.goal,
      activityPreference: context.activityPreference,
      activityLevel: context.activityLevel,
    });
    const rows = explanations.map((e) => ({
      recommendation_score_id: scoreRow.id,
      user_id: userId,
      headline: e.headline,
      detail: e.detail,
      factor_key: e.factorKey,
      sequence: e.sequence,
    }));
    if (rows.length > 0) {
      await supabase.from("recommendation_explanations").insert(rows);
    }
  } catch {
    // Best-effort — a failure here must never block plan generation/completion.
  }
}

/** Today's check-in, if the user submitted one — used to let low energy force an easier plan. */
async function loadTodayCheckIn(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  planDate: string,
) {
  const { data } = await supabase
    .from("daily_check_ins")
    .select("energy_level")
    .eq("user_id", userId)
    .eq("check_in_date", planDate)
    .maybeSingle();
  return data;
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
  const todaysCheckIn = await loadTodayCheckIn(supabase, user.id, planDate);
  const lowEnergyToday = (todaysCheckIn?.energy_level ?? 5) <= 2;
  const allowChallenging = hasRecentHistory && twoWeekConsistency >= 0.8 && !lowEnergyToday;
  const strugglingConsistency = hasRecentHistory && weeklyConsistency < 0.4;
  const forceEasyOnly = strugglingConsistency || lowEnergyToday || Boolean(options.easier);

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
    const rows = chosen.map((c, i) => ({
      daily_plan_id: existingPlan.id,
      user_id: user.id,
      activity_id: c.activity.id,
      position: startPosition + i,
      assigned_reason: "easier",
    }));
    if (rows.length > 0) {
      const { data: insertedQuests, error } = await supabase.from("daily_quests").insert(rows).select();
      if (error) return { ok: false, message: error.message };
      for (const quest of insertedQuests ?? []) {
        const match = chosen.find((c) => c.activity.id === quest.activity_id);
        if (match) {
          await persistRecommendation(supabase, {
            dailyQuestId: quest.id,
            userId: user.id,
            scored: match,
            context: ctx,
          });
        }
      }
    }
    await supabase
      .from("daily_plans")
      .update({ generated_reason: "easier", quest_count: startPosition + rows.length })
      .eq("id", existingPlan.id);

    revalidatePath("/dashboard");
    await trackEvent("make_today_easier_used");
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

  const rows = chosen.map((c, i) => ({
    daily_plan_id: newPlan.id,
    user_id: user.id,
    activity_id: c.activity.id,
    position: i,
    assigned_reason: forceEasyOnly ? "recovery" : "standard",
  }));
  const { data: insertedQuests, error: questsError } = await supabase.from("daily_quests").insert(rows).select();
  if (questsError) return { ok: false, message: questsError.message };

  for (const quest of insertedQuests ?? []) {
    const match = chosen.find((c) => c.activity.id === quest.activity_id);
    if (match) {
      await persistRecommendation(supabase, {
        dailyQuestId: quest.id,
        userId: user.id,
        scored: match,
        context: ctx,
      });
    }
  }

  revalidatePath("/dashboard");
  await trackEvent(options.easier ? "make_today_easier_used" : "daily_plan_generated");
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
  await trackEvent("quest_completed", { dailyQuestId: parsed.data.dailyQuestId });
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
  await trackEvent("quest_skipped", { dailyQuestId: parsed.data.dailyQuestId });
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
    .update({ activity_id: replacement.activity.id, assigned_reason: "replaced" })
    .eq("id", parsed.data.dailyQuestId);
  if (error) return { ok: false, message: error.message };

  await persistRecommendation(supabase, {
    dailyQuestId: parsed.data.dailyQuestId,
    userId: user.id,
    scored: replacement,
    context: ctx,
  });

  revalidatePath("/dashboard");
  await trackEvent("quest_replaced", { dailyQuestId: parsed.data.dailyQuestId });
  return { ok: true };
}
