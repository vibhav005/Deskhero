"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/actions/analytics";
import {
  completeBreakSchema,
  startWorkSessionSchema,
  workSessionIdSchema,
  type CompleteBreakInput,
  type StartWorkSessionInput,
  type WorkSessionIdInput,
} from "@/lib/validation/workmode.schema";

export interface ActionResult {
  ok: boolean;
  message?: string;
  sessionId?: string;
}

export async function startWorkSession(input: StartWorkSessionInput): Promise<ActionResult> {
  const parsed = startWorkSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const { data, error } = await supabase
    .from("work_sessions")
    .insert({ user_id: user.id, planned_minutes: parsed.data.plannedMinutes, status: "active" })
    .select("id")
    .single();
  if (error || !data) return { ok: false, message: error?.message ?? "Could not start session." };

  await trackEvent("work_session_started", { plannedMinutes: parsed.data.plannedMinutes });
  return { ok: true, sessionId: data.id };
}

/** Calls the idempotent SECURITY DEFINER RPC — same ledger/achievement path as a regular quest completion. */
export async function completeBreak(input: CompleteBreakInput): Promise<ActionResult> {
  const parsed = completeBreakSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const { data, error } = await supabase.rpc("complete_work_session_break", {
    p_user_id: user.id,
    p_work_session_id: parsed.data.workSessionId,
    p_activity_id: parsed.data.activityId,
  });
  if (error) return { ok: false, message: error.message };

  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.completed) {
    return { ok: false, message: "This break was already completed or the session isn't active." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/achievements");
  revalidatePath("/progress");
  await trackEvent("work_session_completed", { workSessionId: parsed.data.workSessionId });
  return { ok: true };
}

export async function skipBreak(input: WorkSessionIdInput): Promise<ActionResult> {
  const parsed = workSessionIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const { error } = await supabase
    .from("work_sessions")
    .update({ status: "abandoned", ended_at: new Date().toISOString() })
    .eq("id", parsed.data.workSessionId)
    .eq("user_id", user.id)
    .eq("status", "active");
  if (error) return { ok: false, message: error.message };

  return { ok: true };
}

export async function endSessionEarly(input: WorkSessionIdInput): Promise<ActionResult> {
  const parsed = workSessionIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const { error } = await supabase
    .from("work_sessions")
    .update({ status: "abandoned", ended_at: new Date().toISOString() })
    .eq("id", parsed.data.workSessionId)
    .eq("user_id", user.id)
    .eq("status", "active");
  if (error) return { ok: false, message: error.message };

  return { ok: true };
}
