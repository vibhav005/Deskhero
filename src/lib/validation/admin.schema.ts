import { z } from "zod";

export const searchProfilesSchema = z.object({
  query: z.string().trim().min(1).max(60),
});
export type SearchProfilesInput = z.infer<typeof searchProfilesSchema>;

export const adjustXpSchema = z.object({
  userId: z.string().uuid(),
  xpAmount: z.number().int().refine((n) => n !== 0, "Amount can't be zero."),
  reason: z.string().trim().min(3).max(300),
});
export type AdjustXpInput = z.infer<typeof adjustXpSchema>;

export const upsertActivitySchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only."),
  title: z.string().trim().min(2).max(100),
  category: z.enum(["mobility", "walking", "hydration", "strength", "posture", "eye-care", "breathing", "sleep"]),
  difficulty: z.enum(["easy", "moderate", "challenging"]),
  minutes: z.number().int().min(1).max(60),
  xpValue: z.number().int().min(1).max(200),
  position: z.enum(["standing", "seated", "either"]),
  summary: z.string().trim().min(5).max(300),
  isActive: z.boolean().default(true),
});
export type UpsertActivityInput = z.infer<typeof upsertActivitySchema>;

export const activityIdSchema = z.object({
  activityId: z.string().uuid(),
});
export type ActivityIdInput = z.infer<typeof activityIdSchema>;

export const setActivityActiveSchema = z.object({
  activityId: z.string().uuid(),
  isActive: z.boolean(),
});
export type SetActivityActiveInput = z.infer<typeof setActivityActiveSchema>;

export const reviewFeedbackSchema = z.object({
  feedbackId: z.string().uuid(),
  status: z.enum(["open", "reviewed", "resolved"]),
});
export type ReviewFeedbackInput = z.infer<typeof reviewFeedbackSchema>;
