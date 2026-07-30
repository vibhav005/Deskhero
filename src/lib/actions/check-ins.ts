"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/actions/analytics";
import { todayInTimezone } from "@/lib/tz";
import { submitCheckInSchema, type SubmitCheckInInput } from "@/lib/validation/check-ins.schema";
import type { ActionResult } from "@/lib/actions/quests";

/** Owner-upsert on (user_id, check_in_date) — one check-in per user per day. */
export async function submitCheckIn(input: SubmitCheckInInput): Promise<ActionResult> {
  const parsed = submitCheckInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
  const checkInDate = todayInTimezone(profile?.timezone ?? "UTC");

  const { error } = await supabase.from("daily_check_ins").upsert(
    {
      user_id: user.id,
      check_in_date: checkInDate,
      energy_level: parsed.data.energyLevel,
      soreness_level: parsed.data.sorenessLevel,
      mood: parsed.data.mood,
      notes: parsed.data.notes,
    },
    { onConflict: "user_id,check_in_date" },
  );
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard");
  await trackEvent("check_in_submitted", { energyLevel: parsed.data.energyLevel });
  return { ok: true };
}

export async function getTodayCheckIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
  const checkInDate = todayInTimezone(profile?.timezone ?? "UTC");

  const { data } = await supabase
    .from("daily_check_ins")
    .select("*")
    .eq("user_id", user.id)
    .eq("check_in_date", checkInDate)
    .maybeSingle();
  return data;
}
