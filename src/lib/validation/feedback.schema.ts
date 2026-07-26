import { z } from "zod";

export const submitFeedbackSchema = z.object({
  category: z.enum(["bug", "confusing_experience", "feature_request", "exercise_feedback", "reminder_feedback", "general"]),
  comments: z.string().trim().min(5).max(1000),
  rating: z.number().int().min(1).max(5).optional(),
  pageContext: z.string().max(200).optional(),
  contactOk: z.boolean().default(false),
});
export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
