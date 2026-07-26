import { z } from "zod";

export const createChallengeSchema = z.object({
  name: z.string().trim().min(3).max(60),
  description: z.string().trim().max(500).optional(),
  visibility: z.enum(["public", "invite_code", "private"]),
  maxMembers: z.number().int().min(20).max(50).default(30),
  rankingMetric: z.enum(["participation", "contribution", "consistency", "team_progress"]).default("participation"),
});
export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;

export const joinByCodeSchema = z.object({
  inviteCode: z.string().trim().min(4).max(20),
});
export type JoinByCodeInput = z.infer<typeof joinByCodeSchema>;

export const challengeIdSchema = z.object({
  challengeId: z.string().uuid(),
});
export type ChallengeIdInput = z.infer<typeof challengeIdSchema>;

export const reportChallengeSchema = z.object({
  challengeId: z.string().uuid(),
  comments: z.string().trim().min(5).max(500),
});
export type ReportChallengeInput = z.infer<typeof reportChallengeSchema>;

export const setChallengeStatusSchema = z.object({
  challengeId: z.string().uuid(),
  status: z.enum(["active", "archived", "disabled"]),
});
export type SetChallengeStatusInput = z.infer<typeof setChallengeStatusSchema>;
