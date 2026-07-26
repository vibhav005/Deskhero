"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/actions/analytics";
import {
  challengeIdSchema,
  createChallengeSchema,
  joinByCodeSchema,
  reportChallengeSchema,
  setChallengeStatusSchema,
  type ChallengeIdInput,
  type CreateChallengeInput,
  type JoinByCodeInput,
  type ReportChallengeInput,
  type SetChallengeStatusInput,
} from "@/lib/validation/challenges.schema";

export interface ActionResult {
  ok: boolean;
  message?: string;
  challengeId?: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

function randomCode(length: number): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function createChallenge(input: CreateChallengeInput): Promise<ActionResult> {
  const parsed = createChallengeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const slug = `${slugify(parsed.data.name)}-${randomCode(4).toLowerCase()}`;
  const inviteCode = parsed.data.visibility === "public" ? null : randomCode(8);

  const { data, error } = await supabase
    .from("challenges")
    .insert({
      slug,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      visibility: parsed.data.visibility,
      invite_code: inviteCode,
      owner_id: user.id,
      max_members: parsed.data.maxMembers,
      ranking_metric: parsed.data.rankingMetric,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, message: error?.message ?? "Could not create challenge." };

  revalidatePath("/challenges");
  return { ok: true, challengeId: data.id };
}

export async function joinChallengeByCode(input: JoinByCodeInput): Promise<ActionResult> {
  const parsed = joinByCodeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const { data, error } = await supabase.rpc("join_challenge_by_code", {
    p_invite_code: parsed.data.inviteCode.toUpperCase(),
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/challenges");
  await trackEvent("challenge_joined", { challengeId: data ?? undefined, via: "invite_code" });
  return { ok: true, challengeId: data ?? undefined };
}

/** Direct-join path for public challenges only — RLS restricts the raw insert to visibility='public'. */
export async function joinPublicChallenge(input: ChallengeIdInput): Promise<ActionResult> {
  const parsed = challengeIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const { data: existing } = await supabase
    .from("challenge_members")
    .select("id, left_at")
    .eq("challenge_id", parsed.data.challengeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    if (existing.left_at === null) {
      revalidatePath(`/challenges/${parsed.data.challengeId}`);
      return { ok: true, challengeId: parsed.data.challengeId };
    }
    const { error } = await supabase
      .from("challenge_members")
      .update({ left_at: null })
      .eq("id", existing.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase
      .from("challenge_members")
      .insert({ challenge_id: parsed.data.challengeId, user_id: user.id, role: "member" });
    if (error) return { ok: false, message: error.message };
  }

  revalidatePath(`/challenges/${parsed.data.challengeId}`);
  revalidatePath("/challenges");
  await trackEvent("challenge_joined", { challengeId: parsed.data.challengeId, via: "public" });
  return { ok: true, challengeId: parsed.data.challengeId };
}

export async function leaveChallenge(input: ChallengeIdInput): Promise<ActionResult> {
  const parsed = challengeIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const { error } = await supabase
    .from("challenge_members")
    .update({ left_at: new Date().toISOString() })
    .eq("challenge_id", parsed.data.challengeId)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/challenges/${parsed.data.challengeId}`);
  revalidatePath("/challenges");
  await trackEvent("challenge_left", { challengeId: parsed.data.challengeId });
  return { ok: true };
}

export async function reportChallenge(input: ReportChallengeInput): Promise<ActionResult> {
  const parsed = reportChallengeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    category: "general",
    comments: parsed.data.comments,
    target_type: "challenge",
    target_id: parsed.data.challengeId,
  });
  if (error) return { ok: false, message: error.message };

  await trackEvent("feedback_submitted", { category: "general", targetType: "challenge" });
  return { ok: true, message: "Thanks — the team will take a look." };
}

/** RLS (challenges_update_admin) is the real gate here; this just surfaces a clear message if it's denied. */
export async function setChallengeStatus(input: SetChallengeStatusInput): Promise<ActionResult> {
  const parsed = setChallengeStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid input." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("challenges")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.challengeId)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: "You're not allowed to change this challenge." };

  revalidatePath(`/challenges/${parsed.data.challengeId}`);
  revalidatePath("/challenges");
  return { ok: true };
}
