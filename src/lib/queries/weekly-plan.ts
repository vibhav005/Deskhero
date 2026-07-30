import { createClient } from "@/lib/supabase/server";
import { currentWeekStartInTimezone, isoDayOfWeek, todayInTimezone } from "@/lib/tz";
import type { DayType } from "@/lib/validation/weekly-plan.schema";

export interface WeeklyPlanData {
  activeDaysTarget: number;
  /** Index 0=Monday..6=Sunday. */
  days: (DayType | null)[];
}

export async function getMyWeeklyPlan(): Promise<WeeklyPlanData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
  const weekStartDate = currentWeekStartInTimezone(profile?.timezone ?? "UTC");

  const { data: plan } = await supabase
    .from("weekly_plans")
    .select("id, active_days_target")
    .eq("user_id", user.id)
    .eq("week_start_date", weekStartDate)
    .maybeSingle();
  if (!plan) return null;

  const { data: items } = await supabase
    .from("weekly_plan_items")
    .select("day_of_week, day_type")
    .eq("weekly_plan_id", plan.id);

  const days: (DayType | null)[] = Array(7).fill(null);
  for (const item of items ?? []) {
    days[item.day_of_week] = item.day_type as DayType;
  }

  return { activeDaysTarget: plan.active_days_target, days };
}

/** Today's day-type from the current week's plan, if one exists — the signal generateDailyPlan() consults. */
export async function getTodayDayType(userId: string, timezone: string): Promise<DayType | null> {
  const supabase = await createClient();
  const weekStartDate = currentWeekStartInTimezone(timezone);
  const dayIndex = isoDayOfWeek(todayInTimezone(timezone));

  const { data: plan } = await supabase
    .from("weekly_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start_date", weekStartDate)
    .maybeSingle();
  if (!plan) return null;

  const { data: item } = await supabase
    .from("weekly_plan_items")
    .select("day_type")
    .eq("weekly_plan_id", plan.id)
    .eq("day_of_week", dayIndex)
    .maybeSingle();
  return (item?.day_type as DayType) ?? null;
}
