import { z } from "zod";

export const MOOD_VALUES = ["great", "okay", "tired", "stressed", "sore"] as const;

export const submitCheckInSchema = z.object({
  energyLevel: z.number().int().min(1).max(5),
  sorenessLevel: z.number().int().min(1).max(5).optional(),
  mood: z.enum(MOOD_VALUES).optional(),
  notes: z.string().trim().max(280).optional(),
});
export type SubmitCheckInInput = z.infer<typeof submitCheckInSchema>;
