import { z } from "zod";

export const GOAL_TYPE_VALUES = [
  "stand_breaks",
  "mobility_sessions",
  "walking_days",
  "work_mode_breaks",
  "consistency_days",
] as const;
export type GoalType = (typeof GOAL_TYPE_VALUES)[number];

export const GOAL_LABEL: Record<GoalType, string> = {
  stand_breaks: "Posture/stand breaks this week",
  mobility_sessions: "Mobility sessions this week",
  walking_days: "Days with a walk this week",
  work_mode_breaks: "Work Mode breaks this week",
  consistency_days: "Active days this week",
};

/** Realism ceiling per goal type — a generous but bounded weekly count, to keep custom goals from encouraging unsafe volume. */
export const GOAL_MAX: Record<GoalType, number> = {
  stand_breaks: 35, // ~5/day across a 7-day week
  mobility_sessions: 14, // ~2/day
  walking_days: 7, // can't exceed the days in a week
  work_mode_breaks: 20,
  consistency_days: 7, // can't exceed the days in a week
};

export const createGoalSchema = z
  .object({
    goalType: z.enum(GOAL_TYPE_VALUES),
    targetValue: z.number().int().min(1).max(35),
  })
  .refine((v) => v.targetValue <= GOAL_MAX[v.goalType], {
    message: "That target is higher than we'd recommend for this goal — try a smaller number.",
    path: ["targetValue"],
  });
export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const goalIdSchema = z.object({ goalId: z.string().uuid() });
export type GoalIdInput = z.infer<typeof goalIdSchema>;
