import { z } from "zod";

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:MM format")
  .nullable();

export const updateReminderPreferencesSchema = z.object({
  quietHoursStart: timeString.optional(),
  quietHoursEnd: timeString.optional(),
  maxPerDay: z.number().int().min(1).max(10).optional(),
});
export type UpdateReminderPreferencesInput = z.infer<typeof updateReminderPreferencesSchema>;

export const snoozeSchema = z.object({
  hours: z.union([z.literal(1), z.literal(3), z.literal(24)]),
});
export type SnoozeInput = z.infer<typeof snoozeSchema>;

export const toggleMuteSchema = z.object({
  muted: z.boolean(),
});
export type ToggleMuteInput = z.infer<typeof toggleMuteSchema>;
