import { createClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/tz";
import { levelForXp, dailyScore } from "@/lib/logic";
import type { Database } from "@/types/database";

type Activity = Database["public"]["Tables"]["activities"]["Row"];

export interface DashboardQuest {
  dailyQuestId: string;
  status: "assigned" | "completed" | "skipped";
  activity: Activity;
}

export interface DashboardData {
  displayName: string;
  xp: number;
  level: ReturnType<typeof levelForXp>;
  streak: number;
  bestStreak: number;
  streakFreezeAvailable: boolean;
  hasPlanToday: boolean;
  quests: DashboardQuest[];
  doneCount: number;
  score: number;
  weeklyConsistency: number;
  recentAchievement: { name: string; icon: string | null } | null;
}

export async function getDashboardData(): Promise<DashboardData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return null;

  const planDate = todayInTimezone(profile.timezone);

  const { data: plan } = await supabase
    .from("daily_plans")
    .select("*, daily_quests(*, activities(*))")
    .eq("user_id", user.id)
    .eq("plan_date", planDate)
    .maybeSingle();

  const quests: DashboardQuest[] = (plan?.daily_quests ?? [])
    .filter((q) => q.status !== "skipped")
    .sort((a, b) => a.position - b.position)
    .map((q) => ({
      dailyQuestId: q.id,
      status: q.status as DashboardQuest["status"],
      activity: q.activities as unknown as Activity,
    }));

  const doneCount = quests.filter((q) => q.status === "completed").length;
  const score = dailyScore(doneCount, quests.length);

  const since7 = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const { data: recentCompletions } = await supabase
    .from("quest_completions")
    .select("completed_at")
    .eq("user_id", user.id)
    .gte("completed_at", since7);
  const activeDays = new Set((recentCompletions ?? []).map((c) => c.completed_at.slice(0, 10)));
  const weeklyConsistency = Math.round((activeDays.size / 7) * 100);

  const { data: recentAchievement } = await supabase
    .from("user_achievements")
    .select("unlocked_at, achievements(name, icon)")
    .eq("user_id", user.id)
    .order("unlocked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const achievementInfo = recentAchievement?.achievements as
    | { name: string; icon: string | null }
    | { name: string; icon: string | null }[]
    | null;
  const resolvedAchievement = Array.isArray(achievementInfo) ? achievementInfo[0] : achievementInfo;

  return {
    displayName: profile.display_name?.trim() || "Friend",
    xp: profile.current_xp,
    level: levelForXp(profile.current_xp),
    streak: profile.current_streak,
    bestStreak: profile.best_streak,
    streakFreezeAvailable: profile.streak_freeze_available,
    hasPlanToday: Boolean(plan),
    quests,
    doneCount,
    score,
    weeklyConsistency,
    recentAchievement: resolvedAchievement ?? null,
  };
}
