import { GOAL_PRIORITY, INACTIVE_FOCUS, PREF_BOOST, type ScoreFactors } from "@/lib/quest-engine";

export interface Explanation {
  headline: string;
  detail?: string;
  factorKey: string;
  sequence: number;
}

/**
 * Deterministic, template-based "why was this recommended" copy — no
 * generative AI. Reuses quest-engine's own priority maps so the wording
 * never claims a reason the scorer didn't actually apply.
 */
export function buildExplanations(
  factors: ScoreFactors,
  context: { category: string; goal: string; activityPreference: string; activityLevel: string },
): Explanation[] {
  const lines: Explanation[] = [];
  const next = () => lines.length + 1;

  if (factors.category_priority > 0) {
    if (GOAL_PRIORITY[context.goal]?.includes(context.category)) {
      lines.push({
        headline: `Matches your ${context.goal} goal`,
        factorKey: "category_priority",
        sequence: next(),
      });
    } else if (PREF_BOOST[context.activityPreference]?.includes(context.category)) {
      lines.push({
        headline: `Fits your preference for ${context.activityPreference}`,
        factorKey: "category_priority",
        sequence: next(),
      });
    } else if (context.activityLevel === "inactive" && INACTIVE_FOCUS.includes(context.category)) {
      lines.push({
        headline: "A gentle way to build an active habit",
        factorKey: "category_priority",
        sequence: next(),
      });
    }
  }

  if (factors.time_of_day > 0) {
    lines.push({ headline: "A good fit for this time of day", factorKey: "time_of_day", sequence: next() });
  }

  if (factors.hydration_boost > 0) {
    lines.push({ headline: "A quick hydration reminder", factorKey: "hydration_boost", sequence: next() });
  }

  if (factors.difficulty_ease > 0) {
    lines.push({ headline: "An easy one to keep your momentum going", factorKey: "difficulty_ease", sequence: next() });
  }

  if (factors.skip_penalty < 0) {
    lines.push({
      headline: "Given lower priority since you've skipped it recently",
      factorKey: "skip_penalty",
      sequence: next(),
    });
  }

  if (lines.length === 0) {
    lines.push({ headline: "Picked to keep your plan varied", factorKey: "category_priority", sequence: next() });
  }

  return lines;
}
