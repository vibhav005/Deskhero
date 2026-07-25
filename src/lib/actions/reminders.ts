"use server";

import { createClient } from "@/lib/supabase/server";
import { todayInTimezone, currentHourInTimezone } from "@/lib/tz";
import {
  snoozeSchema,
  toggleMuteSchema,
  updateReminderPreferencesSchema,
  type SnoozeInput,
  type ToggleMuteInput,
  type UpdateReminderPreferencesInput,
} from "@/lib/validation/reminders.schema";
import type { Database } from "@/types/database";

export interface ActionResult {
  ok: boolean;
  message?: string;
}

export type ReminderPreferencesRow = Database["public"]["Tables"]["reminder_preferences"]["Row"];

/** Read-style Server Action — lets the self-fetching client settings widget avoid a Server Component split. */
export async function getMyReminderPreferences(): Promise<ReminderPreferencesRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("reminder_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return data;
}

type PreferencesPatch = Partial<Database["public"]["Tables"]["reminder_preferences"]["Update"]>;

export async function updateReminderPreferences(
  input: UpdateReminderPreferencesInput,
): Promise<ActionResult> {
  const parsed = updateReminderPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const patch: PreferencesPatch = {};
  if (parsed.data.quietHoursStart !== undefined) patch.quiet_hours_start = parsed.data.quietHoursStart;
  if (parsed.data.quietHoursEnd !== undefined) patch.quiet_hours_end = parsed.data.quietHoursEnd;
  if (parsed.data.maxPerDay !== undefined) patch.max_per_day = parsed.data.maxPerDay;

  const { error } = await supabase
    .from("reminder_preferences")
    .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" });
  if (error) return { ok: false, message: error.message };

  return { ok: true };
}

export async function snoozeReminders(input: SnoozeInput): Promise<ActionResult> {
  const parsed = snoozeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const snoozeUntil = new Date(Date.now() + parsed.data.hours * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("reminder_preferences")
    .upsert({ user_id: user.id, snooze_until: snoozeUntil }, { onConflict: "user_id" });
  if (error) return { ok: false, message: error.message };

  return { ok: true };
}

export async function toggleMute(input: ToggleMuteInput): Promise<ActionResult> {
  const parsed = toggleMuteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const { error } = await supabase
    .from("reminder_preferences")
    .upsert({ user_id: user.id, muted: parsed.data.muted }, { onConflict: "user_id" });
  if (error) return { ok: false, message: error.message };

  return { ok: true };
}

const REMINDER_WINDOWS: Record<string, { start: number; end: number } | null> = {
  work: { start: 9, end: 17 },
  morning: { start: 6, end: 10 },
  evening: { start: 17, end: 21 },
  none: null,
};

const NUDGE_MESSAGES = [
  "Every movement counts — got a minute for a quick reset?",
  "A small step is still progress. One quest, whenever you're ready.",
  "Quick nudge: your body could use a short break.",
  "Consistency matters more than perfection — a tiny break counts.",
];

/** Within [start,end), wrapping past midnight (e.g. 22:00-06:00) if end < start. */
function withinRange(minutesNow: number, startMin: number, endMin: number): boolean {
  if (startMin === endMin) return false;
  if (startMin < endMin) return minutesNow >= startMin && minutesNow < endMin;
  return minutesNow >= startMin || minutesNow < endMin;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export interface DueReminderResult {
  shouldFire: boolean;
  message?: string;
}

/**
 * Client-side heartbeat calls this periodically while the app is open (there's
 * no background scheduler yet — true push notifications are a later
 * milestone). Logs to notification_logs on fire, which also backs the
 * max-per-day cap and the minimum-gap-between-reminders check.
 */
export async function checkDueReminder(): Promise<DueReminderResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { shouldFire: false };

  const [{ data: profile }, { data: prefs }, { data: userPrefs }] = await Promise.all([
    supabase.from("profiles").select("timezone").eq("id", user.id).single(),
    supabase.from("reminder_preferences").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_preferences").select("reminder_preference").eq("user_id", user.id).maybeSingle(),
  ]);

  const timezone = profile?.timezone ?? "UTC";
  const reminderKind = userPrefs?.reminder_preference ?? "none";
  if (reminderKind === "none" || !prefs) return { shouldFire: false };
  if (prefs.muted) return { shouldFire: false };
  if (prefs.snooze_until && new Date(prefs.snooze_until) > new Date()) return { shouldFire: false };

  const hour = currentHourInTimezone(timezone);
  const window = REMINDER_WINDOWS[reminderKind];
  if (!window || hour < window.start || hour >= window.end) return { shouldFire: false };

  if (prefs.quiet_hours_start && prefs.quiet_hours_end) {
    const nowMinutes = hour * 60; // hour-level granularity is enough for a quiet-hours guard
    if (
      withinRange(
        nowMinutes,
        toMinutes(prefs.quiet_hours_start.slice(0, 5)),
        toMinutes(prefs.quiet_hours_end.slice(0, 5)),
      )
    ) {
      return { shouldFire: false };
    }
  }

  const todayStart = `${todayInTimezone(timezone)}T00:00:00.000Z`;
  const { data: todayReminders } = await supabase
    .from("notification_logs")
    .select("sent_at")
    .eq("user_id", user.id)
    .eq("kind", "reminder")
    .gte("sent_at", todayStart)
    .order("sent_at", { ascending: false });

  const maxPerDay = prefs.max_per_day ?? 5;
  if ((todayReminders?.length ?? 0) >= maxPerDay) return { shouldFire: false };

  const lastSentAt = todayReminders?.[0]?.sent_at;
  if (lastSentAt && Date.now() - new Date(lastSentAt).getTime() < 60 * 60 * 1000) {
    return { shouldFire: false };
  }

  const message = NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];
  const { error } = await supabase.rpc("log_reminder_sent", { p_message: message });
  if (error) return { shouldFire: false };

  return { shouldFire: true, message };
}
