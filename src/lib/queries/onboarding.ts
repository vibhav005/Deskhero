import { createClient } from "@/lib/supabase/server";

export interface OnboardingProgress {
  displayName: string | null;
  ageRange: string | null;
  timezone: string;
  hoursSitting: number | null;
  activityLevel: string | null;
  goal: string | null;
  sessionDuration: number | null;
  activityPreference: string | null;
  workSchedule: { type?: string } | null;
  reminderPreference: string | null;
  accessibilityPrefs: { reducedMotion?: boolean; largeText?: boolean } | null;
  limitationTags: string[];
  onboardingCompletedAt: string | null;
}

/** Fetches whatever the signed-in user has already answered, for onboarding resumability. */
export async function getOnboardingProgress(): Promise<OnboardingProgress | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: prefs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, age_range, timezone, onboarding_completed_at")
      .eq("id", user.id)
      .single(),
    supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  return {
    displayName: profile?.display_name ?? null,
    ageRange: profile?.age_range ?? null,
    timezone: profile?.timezone ?? "UTC",
    hoursSitting: prefs?.hours_sitting ?? null,
    activityLevel: prefs?.activity_level ?? null,
    goal: prefs?.goal ?? null,
    sessionDuration: prefs?.session_duration ?? null,
    activityPreference: prefs?.activity_preference ?? null,
    workSchedule: (prefs?.work_schedule as { type?: string } | null) ?? null,
    reminderPreference: prefs?.reminder_preference ?? null,
    accessibilityPrefs:
      (prefs?.accessibility_prefs as { reducedMotion?: boolean; largeText?: boolean } | null) ?? null,
    limitationTags: prefs?.limitation_tags ?? [],
    onboardingCompletedAt: profile?.onboarding_completed_at ?? null,
  };
}
