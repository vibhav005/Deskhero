import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/types";

/**
 * Fetches enough of the real Supabase profile to hydrate the legacy
 * localStorage store (see LegacyStoreBridge) for pages not yet rebuilt on
 * Server Components (M2/M3 scope). Returns null if there's no session.
 *
 * Temporary bridge — remove once dashboard/quests/achievements/etc. read
 * directly from Supabase instead of the local store.
 */
export async function getLegacyBridgeProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: prefs }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  return {
    name: profile?.display_name?.trim() || "Friend",
    hoursSitting: prefs?.hours_sitting ?? 8,
    activityLevel: (prefs?.activity_level as UserProfile["activityLevel"]) ?? "light",
    goal: (prefs?.goal as UserProfile["goal"]) ?? "general",
    sessionDuration: (prefs?.session_duration as UserProfile["sessionDuration"]) ?? 10,
    activityPreference: (prefs?.activity_preference as UserProfile["activityPreference"]) ?? "mixed",
    reminderPreference: (prefs?.reminder_preference as UserProfile["reminderPreference"]) ?? "work",
  };
}
