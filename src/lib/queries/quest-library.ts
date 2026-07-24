import { createClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/tz";

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
  if (!user) return { activity, dailyQuestId: null, status: null };

  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
  const planDate = todayInTimezone(profile?.timezone ?? "UTC");

  const { data: plan } = await supabase
    .from("daily_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("plan_date", planDate)
    .maybeSingle();

  if (!plan) return { activity, dailyQuestId: null, status: null };

  const { data: dailyQuest } = await supabase
    .from("daily_quests")
    .select("id, status")
    .eq("daily_plan_id", plan.id)
    .eq("activity_id", activity.id)
    .maybeSingle();

  return {
    activity,
    dailyQuestId: dailyQuest?.id ?? null,
    status: (dailyQuest?.status as ActivityDetail["status"]) ?? null,
  };
}
