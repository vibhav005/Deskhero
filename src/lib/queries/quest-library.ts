import { createClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/tz";
import { getRecommendationExplanation, type RecommendationInfo } from "@/lib/queries/recommendations";

export async function getActivities() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("is_active", true)
    .order("category");
  return data ?? [];
}

export interface ActivityDetail {
  activity: NonNullable<Awaited<ReturnType<typeof getActivityBySlug>>>;
  dailyQuestId: string | null;
  status: "assigned" | "completed" | "skipped" | null;
  recommendation: RecommendationInfo | null;
}

export async function getActivityBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return data;
}

/** The activity plus (if applicable) today's assignment state, for the quest detail page. */
export async function getActivityDetail(slug: string): Promise<ActivityDetail | null> {
  const supabase = await createClient();
  const activity = await getActivityBySlug(slug);
  if (!activity) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { activity, dailyQuestId: null, status: null, recommendation: null };

  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
  const planDate = todayInTimezone(profile?.timezone ?? "UTC");

  const { data: plan } = await supabase
    .from("daily_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("plan_date", planDate)
    .maybeSingle();

  if (!plan) return { activity, dailyQuestId: null, status: null, recommendation: null };

  const { data: dailyQuest } = await supabase
    .from("daily_quests")
    .select("id, status")
    .eq("daily_plan_id", plan.id)
    .eq("activity_id", activity.id)
    .maybeSingle();

  const recommendation = dailyQuest ? await getRecommendationExplanation(dailyQuest.id) : null;

  return {
    activity,
    dailyQuestId: dailyQuest?.id ?? null,
    status: (dailyQuest?.status as ActivityDetail["status"]) ?? null,
    recommendation,
  };
}

export interface WorkoutStepRow {
  position: number;
  seconds: number | null;
  reps: number | null;
  exercise: {
    name: string;
    instruction: string;
    easier_variant: string | null;
    icon: string | null;
  };
}

/** The ordered exercise steps for a guided workout, given the workout's id. */
export async function getWorkoutSteps(workoutId: string): Promise<WorkoutStepRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_exercises")
    .select("position, seconds, reps, exercises(name, instruction, easier_variant, icon)")
    .eq("workout_id", workoutId)
    .order("position");

  return (data ?? []).map((row) => {
    const exercise = Array.isArray(row.exercises) ? row.exercises[0] : row.exercises;
    return {
      position: row.position,
      seconds: row.seconds,
      reps: row.reps,
      exercise: exercise ?? { name: "Exercise", instruction: "", easier_variant: null, icon: null },
    };
  });
}
