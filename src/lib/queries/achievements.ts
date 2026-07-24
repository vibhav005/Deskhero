import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type StatsRow = Database["public"]["Functions"]["get_my_stats"]["Returns"][number];

const METRIC_TO_STAT_KEY: Record<string, keyof StatsRow> = {
  questsCompleted: "quests_completed",
  hydrationCompleted: "hydration_completed",
  walksCompleted: "walks_completed",
  postureCompleted: "posture_completed",
  mobilityCompleted: "mobility_completed",
  workoutsCompleted: "workouts_completed",
  bestStreak: "best_streak",
  daysActive: "days_active",
};

export interface AchievementWithProgress {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  target: number;
  progress: number;
  tier: "bronze" | "silver" | "gold";
  unlocked: boolean;
  unlockedAt: string | null;
}

export async function getAchievementsWithProgress(): Promise<AchievementWithProgress[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: achievements }, { data: rules }, { data: unlocked }, { data: stats }] = await Promise.all([
    supabase.from("achievements").select("*").eq("is_active", true),
    supabase.from("achievement_rules").select("*"),
    supabase.from("user_achievements").select("achievement_id, unlocked_at").eq("user_id", user.id),
    supabase.rpc("get_my_stats").single(),
  ]);

  const unlockedByAchievement = new Map((unlocked ?? []).map((u) => [u.achievement_id, u.unlocked_at]));
  const ruleByAchievement = new Map((rules ?? []).map((r) => [r.achievement_id, r]));

  return (achievements ?? []).map((a) => {
    const rule = ruleByAchievement.get(a.id);
    const statKey = rule ? METRIC_TO_STAT_KEY[rule.metric] : undefined;
    const rawProgress = statKey && stats ? Number(stats[statKey] ?? 0) : 0;
    const unlockedAt = unlockedByAchievement.get(a.id) ?? null;

    return {
      id: a.id,
      slug: a.slug,
      name: a.name,
      description: a.description,
      icon: a.icon,
      target: a.target,
      progress: Math.min(a.target, rawProgress),
      tier: a.tier as AchievementWithProgress["tier"],
      unlocked: unlockedAt !== null,
      unlockedAt,
    };
  });
}
