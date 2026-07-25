import { createClient } from "@/lib/supabase/server";
import { levelForXp } from "@/lib/logic";
import type { Database } from "@/types/database";

type StatsRow = Database["public"]["Functions"]["get_my_stats"]["Returns"][number];

export interface ProgressHistoryDay {
  date: string;
  /** Kept as an array (rather than a bare count) so it drop-in matches StreakCalendar's DayRecord shape. */
  completedQuestIds: string[];
  assigned: number;
}

export interface ProgressData {
  displayName: string;
  xp: number;
  level: ReturnType<typeof levelForXp>;
  streak: number;
  bestStreak: number;
  stats: StatsRow;
  history: ProgressHistoryDay[];
}

export async function getProgressData(): Promise<ProgressData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: stats }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.rpc("get_my_stats").single(),
  ]);
  if (!profile || !stats) return null;

  const since = new Date(Date.now() - 70 * 86400000).toISOString().slice(0, 10);
  const { data: plans } = await supabase
    .from("daily_plans")
    .select("id, plan_date, quest_count")
    .eq("user_id", user.id)
    .gte("plan_date", since)
    .order("plan_date");

  const planIds = (plans ?? []).map((p) => p.id);
  const completedCountByPlan = new Map<string, number>();
  if (planIds.length > 0) {
    const { data: completedQuests } = await supabase
      .from("daily_quests")
      .select("daily_plan_id")
      .in("daily_plan_id", planIds)
      .eq("status", "completed");
    for (const row of completedQuests ?? []) {
      completedCountByPlan.set(row.daily_plan_id, (completedCountByPlan.get(row.daily_plan_id) ?? 0) + 1);
    }
  }

  const history: ProgressHistoryDay[] = (plans ?? []).map((p) => ({
    date: p.plan_date,
    completedQuestIds: Array(completedCountByPlan.get(p.id) ?? 0).fill(""),
    assigned: p.quest_count,
  }));

  return {
    displayName: profile.display_name?.trim() || "Friend",
    xp: profile.current_xp,
    level: levelForXp(profile.current_xp),
    streak: profile.current_streak,
    bestStreak: profile.best_streak,
    stats,
    history,
  };
}
