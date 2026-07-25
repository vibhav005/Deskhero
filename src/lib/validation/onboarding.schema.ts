import { z } from "zod";

export const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"] as const;
export const WORK_SCHEDULE_TYPES = ["standard", "early", "late", "flexible"] as const;
// Fixed, non-diagnostic limitation choices — never a diagnosis field.
export const LIMITATION_TAGS = [
  "prefer_seated",
  "avoid_jumping",
  "avoid_floor_exercises",
  "prefer_low_impact",
] as const;

/**
 * Every field is optional so the same schema can validate a single step's
 * partial payload — the Server Action only touches columns actually present.
 */
export const onboardingStepSchema = z.object({
  displayName: z.string().trim().min(1).max(60).optional(),
  ageRange: z.enum(AGE_RANGES).optional(),
  timezone: z.string().min(1).optional(),
  hoursSitting: z.number().int().min(0).max(16).optional(),
  activityLevel: z.enum(["inactive", "light", "moderate"]).optional(),
  goal: z.enum(["energy", "posture", "strength", "flexibility", "sleep", "general"]).optional(),
  sessionDuration: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]).optional(),
  activityPreference: z
    .enum(["walking", "stretching", "strength", "breathing", "mixed"])
    .optional(),
  workSchedule: z.object({ type: z.enum(WORK_SCHEDULE_TYPES) }).optional(),
  reminderPreference: z.enum(["work", "morning", "evening", "none"]).optional(),
  accessibilityPrefs: z
    .object({
      reducedMotion: z.boolean().optional(),
      largeText: z.boolean().optional(),
    })
    .optional(),
  limitationTags: z.array(z.enum(LIMITATION_TAGS)).optional(),
});
export type OnboardingStepInput = z.infer<typeof onboardingStepSchema>;

export const completeOnboardingSchema = z.object({
  consentTos: z.literal(true, { message: "You must accept the Terms to continue." }),
  consentPrivacy: z.literal(true, { message: "You must accept the Privacy Policy to continue." }),
});
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
