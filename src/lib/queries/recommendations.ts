import { createClient } from "@/lib/supabase/server";

export interface RecommendationExplanation {
  headline: string;
  detail: string | null;
  factorKey: string;
  sequence: number;
}

export interface RecommendationInfo {
  totalScore: number;
  factors: Record<string, number>;
  explanations: RecommendationExplanation[];
}

/** Full stored explanation for one daily quest, for the quest-detail "why this was recommended" panel. */
export async function getRecommendationExplanation(dailyQuestId: string): Promise<RecommendationInfo | null> {
  const supabase = await createClient();
  const { data: scoreRow } = await supabase
    .from("recommendation_scores")
    .select("id, total_score, factors")
    .eq("daily_quest_id", dailyQuestId)
    .maybeSingle();
  if (!scoreRow) return null;

  const { data: explanations } = await supabase
    .from("recommendation_explanations")
    .select("headline, detail, factor_key, sequence")
    .eq("recommendation_score_id", scoreRow.id)
    .order("sequence");

  return {
    totalScore: scoreRow.total_score,
    factors: (scoreRow.factors as Record<string, number>) ?? {},
    explanations: (explanations ?? []).map((e) => ({
      headline: e.headline,
      detail: e.detail,
      factorKey: e.factor_key,
      sequence: e.sequence,
    })),
  };
}

/** Batch-fetches just the top (sequence 1) headline per daily quest, for the dashboard's compact list caption. */
export async function getTopReasonsByDailyQuestIds(dailyQuestIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (dailyQuestIds.length === 0) return map;

  const supabase = await createClient();
  const { data } = await supabase
    .from("recommendation_scores")
    .select("daily_quest_id, recommendation_explanations(headline, sequence)")
    .in("daily_quest_id", dailyQuestIds);

  for (const row of data ?? []) {
    const explanations = row.recommendation_explanations ?? [];
    const top = [...explanations].sort((a, b) => a.sequence - b.sequence)[0];
    if (top) map.set(row.daily_quest_id, top.headline);
  }
  return map;
}
