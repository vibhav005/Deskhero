"use server";

import { createClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/actions/analytics";
import { submitFeedbackSchema, type SubmitFeedbackInput } from "@/lib/validation/feedback.schema";

export interface ActionResult {
  ok: boolean;
  message?: string;
}

export async function submitFeedback(input: SubmitFeedbackInput): Promise<ActionResult> {
  const parsed = submitFeedbackSchema.safeParse(input);
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
    category: parsed.data.category,
    comments: parsed.data.comments,
    rating: parsed.data.rating ?? null,
    page_context: parsed.data.pageContext ?? null,
    contact_ok: parsed.data.contactOk,
  });
  if (error) return { ok: false, message: error.message };

  await trackEvent("feedback_submitted", { category: parsed.data.category });
  return { ok: true, message: "Thanks for the feedback — it helps a lot." };
}
