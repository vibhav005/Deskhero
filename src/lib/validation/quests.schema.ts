import { z } from "zod";

export const dailyQuestIdSchema = z.object({
  dailyQuestId: z.string().uuid(),
});
export type DailyQuestIdInput = z.infer<typeof dailyQuestIdSchema>;

export const completeQuestSchema = z.object({
  dailyQuestId: z.string().uuid(),
  notes: z.string().trim().max(500).optional(),
});
export type CompleteQuestInput = z.infer<typeof completeQuestSchema>;
