import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ChallengeRow = Database["public"]["Tables"]["challenges"]["Row"];
export type LeaderboardRow = Database["public"]["Functions"]["get_challenge_leaderboard"]["Returns"][number];
export type MemberRow = Database["public"]["Functions"]["get_challenge_members"]["Returns"][number];

const CHALLENGE_FIELDS =
  "id, slug, name, description, visibility, invite_code, owner_id, max_members, status, starts_at, ends_at, ranking_metric, created_at";

export interface ChallengeSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  visibility: "public" | "invite_code" | "private";
  invite_code: string | null;
  owner_id: string;
  max_members: number;
  status: "active" | "archived" | "disabled";
  starts_at: string | null;
  ends_at: string | null;
  ranking_metric: string;
  created_at: string;
}

export async function listBrowseChallenges(): Promise<ChallengeSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenges")
    .select(CHALLENGE_FIELDS)
    .eq("visibility", "public")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .returns<ChallengeSummary[]>();
  return data ?? [];
}

export interface MyChallengeRow {
  role: string;
  joined_at: string;
  left_at: string | null;
  challenges: ChallengeSummary;
}

export async function listMyChallenges(): Promise<MyChallengeRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("challenge_members")
    .select(`role, joined_at, left_at, challenges (${CHALLENGE_FIELDS})`)
    .eq("user_id", user.id)
    .is("left_at", null)
    .order("joined_at", { ascending: false })
    .returns<MyChallengeRow[]>();

  return data ?? [];
}

export interface ChallengeDetail {
  challenge: ChallengeRow;
  myRole: "owner" | "member" | null;
  isActiveMember: boolean;
  leaderboard: LeaderboardRow[];
  members: MemberRow[];
}

export async function getChallengeDetail(challengeId: string): Promise<ChallengeDetail | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: challenge } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .maybeSingle();
  if (!challenge) return null;

  let myRole: "owner" | "member" | null = null;
  let isActiveMember = false;

  if (user) {
    const { data: membership } = await supabase
      .from("challenge_members")
      .select("role, left_at")
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (membership && !membership.left_at) {
      myRole = membership.role as "owner" | "member";
      isActiveMember = true;
    }
  }

  let leaderboard: LeaderboardRow[] = [];
  let members: MemberRow[] = [];
  if (isActiveMember) {
    const [{ data: lb }, { data: mem }] = await Promise.all([
      supabase.rpc("get_challenge_leaderboard", { p_challenge_id: challengeId }),
      supabase.rpc("get_challenge_members", { p_challenge_id: challengeId }),
    ]);
    leaderboard = lb ?? [];
    members = mem ?? [];
  }

  return { challenge, myRole, isActiveMember, leaderboard, members };
}
