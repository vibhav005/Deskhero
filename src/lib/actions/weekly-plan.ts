"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentWeekStartInTimezone } from "@/lib/tz";
import { upsertWeeklyPlanSchema, type UpsertWeeklyPlanInput } from "@/lib/validation/weekly-plan.schema";
import type { ActionResult } from "@/lib/actions/quests";

/** Creates or replaces the current week's plan (7 day-type slots) for the signed-in user. */
export async function upsertWeeklyPlan(input: UpsertWeeklyPlanInput): Promise<ActionResult> {
  const parsed = upsertWeeklyPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
  const weekStartDate = currentWeekStartInTimezone(profile?.timezone ?? "UTC");

  const { data: plan, error: planError } = await supabase
    .from("weekly_plans")
    .upsert(
      { user_id: user.id, week_start_date: weekStartDate, active_days_target: parsed.data.activeDaysTarget },
      { onConflict: "user_id,week_start_date" },
    )
    .select()
    .single();
  if (planError || !plan) return { ok: false, message: planError?.message ?? "Could not save your weekly plan." };

  await supabase.from("weekly_plan_items").delete().eq("weekly_plan_id", plan.id);

  const rows = parsed.data.days.map((dayType, dayOfWeek) => ({
    weekly_plan_id: plan.id,
    user_id: user.id,
    day_of_week: dayOfWeek,
    day_type: dayType,
  }));
  const { error: itemsError } = await supabase.from("weekly_plan_items").insert(rows);
  if (itemsError) return { ok: false, message: itemsError.message };

  revalidatePath("/weekly-plan");
  revalidatePath("/dashboard");
  return { ok: true };
}
