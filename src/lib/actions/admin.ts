"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  activityIdSchema,
  adjustXpSchema,
  reviewFeedbackSchema,
  searchProfilesSchema,
  setActivityActiveSchema,
  upsertActivitySchema,
  type ActivityIdInput,
  type AdjustXpInput,
  type ReviewFeedbackInput,
  type SearchProfilesInput,
  type SetActivityActiveInput,
  type UpsertActivityInput,
} from "@/lib/validation/admin.schema";
import type { Database } from "@/types/database";

export interface ActionResult {
  ok: boolean;
  message?: string;
}

type SearchResult = Database["public"]["Functions"]["search_profiles_admin"]["Returns"][number];

export async function searchProfiles(input: SearchProfilesInput): Promise<{ ok: boolean; results: SearchResult[]; message?: string }> {
  const parsed = searchProfilesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, results: [], message: "Invalid input." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_profiles_admin", { p_query: parsed.data.query });
  if (error) return { ok: false, results: [], message: error.message };

  return { ok: true, results: data ?? [] };
}

export async function adjustXp(input: AdjustXpInput): Promise<ActionResult> {
  const parsed = adjustXpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_adjust_xp", {
    p_user_id: parsed.data.userId,
    p_xp_amount: parsed.data.xpAmount,
    p_reason: parsed.data.reason,
  });
  if (error) return { ok: false, message: error.message };

  return { ok: true, message: "XP adjusted." };
}

export async function upsertActivity(input: UpsertActivityInput): Promise<ActionResult> {
  const parsed = upsertActivitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const row = {
    slug: parsed.data.slug,
    title: parsed.data.title,
    category: parsed.data.category,
    difficulty: parsed.data.difficulty,
    minutes: parsed.data.minutes,
    xp_value: parsed.data.xpValue,
    position: parsed.data.position,
    summary: parsed.data.summary,
    is_active: parsed.data.isActive,
  };

  const { error } = parsed.data.id
    ? await supabase.from("activities").update(row).eq("id", parsed.data.id)
    : await supabase.from("activities").insert(row);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/activities");
  return { ok: true };
}

export async function setActivityActive(input: SetActivityActiveInput): Promise<ActionResult> {
  const parsed = setActivityActiveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid input." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("activities")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.activityId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/activities");
  return { ok: true };
}

export async function deleteActivity(input: ActivityIdInput): Promise<ActionResult> {
  const parsed = activityIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid input." };

  const supabase = await createClient();
  const { error } = await supabase.from("activities").delete().eq("id", parsed.data.activityId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/activities");
  return { ok: true };
}

export async function reviewFeedback(input: ReviewFeedbackInput): Promise<ActionResult> {
  const parsed = reviewFeedbackSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const { error } = await supabase
    .from("feedback")
    .update({ status: parsed.data.status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", parsed.data.feedbackId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/feedback");
  return { ok: true };
}
