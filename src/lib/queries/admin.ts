import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type AdminDashboardStats = Database["public"]["Functions"]["get_admin_dashboard_stats"]["Returns"][number];

export async function getAdminDashboardStats(): Promise<AdminDashboardStats | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_admin_dashboard_stats");
  if (error || !data?.[0]) return null;
  return data[0];
}

export type AdminActivityRow = Database["public"]["Tables"]["activities"]["Row"];

export async function listActivitiesAdmin(): Promise<AdminActivityRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("*")
    .order("category")
    .order("title");
  return data ?? [];
}

export type AdminFeedbackRow = Database["public"]["Tables"]["feedback"]["Row"];

export async function listFeedbackAdmin(): Promise<AdminFeedbackRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("feedback")
    .select("*")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}
