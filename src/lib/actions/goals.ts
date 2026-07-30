"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createGoalSchema, goalIdSchema, type CreateGoalInput, type GoalIdInput } from "@/lib/validation/goals.schema";
import type { ActionResult } from "@/lib/actions/quests";

export async function createGoal(input: CreateGoalInput): Promise<ActionResult> {
  const parsed = createGoalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const { error } = await supabase.from("user_goals").insert({
    user_id: user.id,
    goal_type: parsed.data.goalType,
    target_value: parsed.data.targetValue,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/weekly-plan");
  return { ok: true };
}

export async function deactivateGoal(input: GoalIdInput): Promise<ActionResult> {
  const parsed = goalIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You need to be signed in." };

  const { error } = await supabase
    .from("user_goals")
    .update({ is_active: false })
    .eq("id", parsed.data.goalId)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/weekly-plan");
  return { ok: true };
}
