"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteAccountSchema, type DeleteAccountInput } from "@/lib/validation/privacy.schema";

export interface ActionResult {
  ok: boolean;
  message?: string;
}

/**
 * Everything the user owns, scoped entirely by RLS (this uses the regular
 * session-bound client, so it can only ever return the caller's own rows —
 * there's no separate authorization check to get wrong). Excludes the public
 * content catalog (activities/workouts/exercises/achievements) since that's
 * not user-owned, and audit_logs, which is an internal system record rather
 * than data about the user's own activity.
 */
export async function exportMyData(): Promise<{ ok: boolean; data?: Record<string, unknown>; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const [
    profile,
    preferences,
    dailyPlans,
    dailyQuests,
    completions,
    xpTransactions,
    achievements,
    workSessions,
    reminderPreferences,
    notifications,
    challengeMemberships,
    challengeContributions,
    favourites,
    feedback,
    analyticsEvents,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("daily_plans").select("*").eq("user_id", user.id),
    supabase.from("daily_quests").select("*").eq("user_id", user.id),
    supabase.from("quest_completions").select("*").eq("user_id", user.id),
    supabase.from("xp_transactions").select("*").eq("user_id", user.id),
    supabase.from("user_achievements").select("*").eq("user_id", user.id),
    supabase.from("work_sessions").select("*").eq("user_id", user.id),
    supabase.from("reminder_preferences").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("notification_logs").select("*").eq("user_id", user.id),
    supabase.from("challenge_members").select("*").eq("user_id", user.id),
    supabase.from("challenge_contributions").select("*").eq("user_id", user.id),
    supabase.from("user_favourites").select("*").eq("user_id", user.id),
    supabase.from("feedback").select("*").eq("user_id", user.id),
    supabase.from("analytics_events").select("*").eq("user_id", user.id),
  ]);

  return {
    ok: true,
    data: {
      exported_at: new Date().toISOString(),
      profile: profile.data,
      preferences: preferences.data,
      daily_plans: dailyPlans.data ?? [],
      daily_quests: dailyQuests.data ?? [],
      quest_completions: completions.data ?? [],
      xp_transactions: xpTransactions.data ?? [],
      achievements: achievements.data ?? [],
      work_sessions: workSessions.data ?? [],
      reminder_preferences: reminderPreferences.data,
      notification_logs: notifications.data ?? [],
      challenge_memberships: challengeMemberships.data ?? [],
      challenge_contributions: challengeContributions.data ?? [],
      favourites: favourites.data ?? [],
      feedback: feedback.data ?? [],
      analytics_events: analyticsEvents.data ?? [],
    },
  };
}

export async function resetMyProgress(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reset_my_progress");
  if (error) return { ok: false, message: error.message };

  revalidatePath("/", "layout");
  return { ok: true, message: "Your progress has been reset to Level 1." };
}

/**
 * Re-verifies the password (a fresh signInWithPassword call, not just trusting
 * the existing session) before doing anything irreversible. Any challenge the
 * user owns is deleted first via the service-role client — challenges.owner_id
 * has no cascade/set-null rule, so it would otherwise block the account
 * deletion outright. That does mean fellow members lose that challenge's
 * history too; there's no ownership-transfer flow yet.
 */
export async function deleteMyAccount(input: DeleteAccountInput): Promise<ActionResult> {
  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, message: "You need to be signed in." };

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.password,
  });
  if (reauthError) return { ok: false, message: "That password isn't correct." };

  const admin = createAdminClient();
  const { error: challengesError } = await admin.from("challenges").delete().eq("owner_id", user.id);
  if (challengesError) return { ok: false, message: challengesError.message };

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return { ok: false, message: deleteError.message };

  await supabase.auth.signOut();
  redirect("/");
}
