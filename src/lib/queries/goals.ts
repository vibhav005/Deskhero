import { createClient } from "@/lib/supabase/server";
import { currentWeekStartInTimezone } from "@/lib/tz";
import { GOAL_LABEL, GOAL_MAX, type GoalType } from "@/lib/validation/goals.schema";

export interface GoalWithProgress {
  id: string;
  goalType: GoalType;
  label: string;
  targetValue: number;
  progress: number;
  max: number;
}

/**
 * Progress is computed read-only from existing quest_completions/activities
 * data for the current week — a goal can't be satisfied by anything other
 * than real, already-audited completions.
 */
export async function getMyGoalsWithProgress(): Promise<GoalWithProgress[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: goals } = await supabase
    .from("user_goals")
    .select("id, goal_type, target_value")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at");
  if (!goals || goals.length === 0) return [];

  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
  const since = `${currentWeekStartInTimezone(profile?.timezone ?? "UTC")}T00:00:00.000Z`;

  const { data: completions } = await supabase
    .from("quest_completions")
    .select("completed_at, work_session_id, activities(category)")
    .eq("user_id", user.id)
    .gte("completed_at", since);
  const rows = completions ?? [];

  function categoryCount(category: string): number {
    return rows.filter((r) => {
      const activity = Array.isArray(r.activities) ? r.activities[0] : r.activities;
      return activity?.category === category;
    }).length;
  }
  function distinctDays(predicate: (r: (typeof rows)[number]) => boolean): number {
    return new Set(rows.filter(predicate).map((r) => r.completed_at.slice(0, 10))).size;
  }

  return goals.map((g) => {
    const goalType = g.goal_type as GoalType;
    let progress = 0;
    switch (goalType) {
      case "stand_breaks":
        progress = categoryCount("posture");
        break;
      case "mobility_sessions":
        progress = categoryCount("mobility");
        break;
      case "walking_days":
        progress = distinctDays((r) => {
          const a = Array.isArray(r.activities) ? r.activities[0] : r.activities;
          return a?.category === "walking";
        });
        break;
      case "work_mode_breaks":
        progress = rows.filter((r) => r.work_session_id !== null).length;
        break;
      case "consistency_days":
        progress = distinctDays(() => true);
        break;
    }
    return {
      id: g.id,
      goalType,
      label: GOAL_LABEL[goalType],
      targetValue: g.target_value,
      progress,
      max: GOAL_MAX[goalType],
    };
  });
}
