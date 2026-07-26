"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/actions/analytics";
import {
  completeOnboardingSchema,
  onboardingStepSchema,
  type OnboardingStepInput,
} from "@/lib/validation/onboarding.schema";
import type { Database } from "@/types/database";

type ProfilePatch = Partial<Database["public"]["Tables"]["profiles"]["Update"]>;
type PreferencesPatch = Partial<Database["public"]["Tables"]["user_preferences"]["Update"]>;

export interface StepResult {
  ok: boolean;
  message?: string;
}

/** Persists whichever fields are present in `input` — called after every onboarding step. */
export async function saveOnboardingStep(input: OnboardingStepInput): Promise<StepResult> {
  const parsed = onboardingStepSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const profilePatch: ProfilePatch = {};
  if (data.displayName !== undefined) profilePatch.display_name = data.displayName;
  if (data.ageRange !== undefined) profilePatch.age_range = data.ageRange;
  if (data.timezone !== undefined) profilePatch.timezone = data.timezone;

  if (Object.keys(profilePatch).length > 0) {
    const { error } = await supabase.from("profiles").update(profilePatch).eq("id", user.id);
    if (error) return { ok: false, message: error.message };
  }

  const prefPatch: PreferencesPatch = {};
  if (data.hoursSitting !== undefined) prefPatch.hours_sitting = data.hoursSitting;
  if (data.activityLevel !== undefined) prefPatch.activity_level = data.activityLevel;
  if (data.goal !== undefined) prefPatch.goal = data.goal;
  if (data.sessionDuration !== undefined) prefPatch.session_duration = data.sessionDuration;
  if (data.activityPreference !== undefined) prefPatch.activity_preference = data.activityPreference;
  if (data.workSchedule !== undefined) prefPatch.work_schedule = data.workSchedule;
  if (data.reminderPreference !== undefined) prefPatch.reminder_preference = data.reminderPreference;
  if (data.accessibilityPrefs !== undefined) prefPatch.accessibility_prefs = data.accessibilityPrefs;
  if (data.limitationTags !== undefined) prefPatch.limitation_tags = data.limitationTags;

  if (Object.keys(prefPatch).length > 0) {
    const { error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: user.id, ...prefPatch }, { onConflict: "user_id" });
    if (error) return { ok: false, message: error.message };
  }

  // Reminder preference is also the seed value for reminder_preferences,
  // which the Reminders milestone (M4) reads/writes from directly.
  if (data.reminderPreference !== undefined) {
    const { error } = await supabase
      .from("reminder_preferences")
      .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });
    if (error) return { ok: false, message: error.message };
  }

  return { ok: true };
}

export async function completeOnboarding(
  _prev: StepResult,
  formData: FormData,
): Promise<StepResult> {
  const parsed = completeOnboardingSchema.safeParse({
    consentTos: formData.get("consentTos") === "on",
    consentPrivacy: formData.get("consentPrivacy") === "on",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Please accept both to continue." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({
      consent_tos_at: now,
      consent_privacy_at: now,
      onboarding_completed_at: now,
    })
    .eq("id", user.id);

  if (error) return { ok: false, message: error.message };

  await trackEvent("onboarding_completed");

  // (app)/layout.tsx's onboarding-gate check is cached per route by Next's
  // router cache — without this, a client-side push to /dashboard right
  // after completing onboarding can serve a stale pre-completion redirect
  // back to /onboarding. Busting the whole tree forces a fresh read.
  revalidatePath("/", "layout");

  return { ok: true };
}
