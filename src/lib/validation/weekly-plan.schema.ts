import { z } from "zod";

export const DAY_TYPE_VALUES = ["workout", "light", "recovery", "rest", "work_heavy"] as const;
export type DayType = (typeof DAY_TYPE_VALUES)[number];

export const upsertWeeklyPlanSchema = z.object({
  activeDaysTarget: z.number().int().min(1).max(7),
  // Exactly 7 entries, index 0=Monday..6=Sunday.
  days: z.array(z.enum(DAY_TYPE_VALUES)).length(7),
});
export type UpsertWeeklyPlanInput = z.infer<typeof upsertWeeklyPlanSchema>;
