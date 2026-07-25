import { z } from "zod";

export const startWorkSessionSchema = z.object({
  plannedMinutes: z.number().int().min(15).max(90),
});
export type StartWorkSessionInput = z.infer<typeof startWorkSessionSchema>;

export const completeBreakSchema = z.object({
  workSessionId: z.string().uuid(),
  activityId: z.string().uuid(),
});
export type CompleteBreakInput = z.infer<typeof completeBreakSchema>;

export const workSessionIdSchema = z.object({
  workSessionId: z.string().uuid(),
});
export type WorkSessionIdInput = z.infer<typeof workSessionIdSchema>;
