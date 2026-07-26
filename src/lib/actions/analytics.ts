"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

type AnalyticsEventName = Database["public"]["Tables"]["analytics_events"]["Row"]["event_name"];

/**
 * Fire-and-forget: RLS silently rejects the insert if the user hasn't opted
 * into consent_analytics, and any other failure here should never break the
 * action that triggered it, so errors are swallowed rather than surfaced.
 */
export async function trackEvent(
  eventName: AnalyticsEventName,
  properties: Record<string, Json> = {},
): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("analytics_events").insert({
      user_id: user.id,
      event_name: eventName,
      properties,
    });
  } catch {
    // Analytics must never break the caller's primary action.
  }
}

/** Read-style Server Action — lets the self-fetching client settings widget avoid a Server Component split. */
export async function getMyAnalyticsConsent(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase.from("profiles").select("consent_analytics").eq("id", user.id).maybeSingle();
  return data?.consent_analytics ?? false;
}

/**
 * consent_analytics defaults to false and there's no onboarding step for it
 * yet, so without this toggle every trackEvent() call above silently no-ops
 * for every user (RLS requires consent_analytics = true to insert).
 */
export async function updateAnalyticsConsent(consent: boolean): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const { error } = await supabase.from("profiles").update({ consent_analytics: consent }).eq("id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/profile");
  return { ok: true };
}
