import { createClient } from "@/lib/supabase/server";

/** Short posture/eye-care/hydration/walking options offered at the end of a focus session. */
export async function getBreakActivities() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select("*")
    .in("category", ["posture", "eye-care", "hydration", "walking"])
    .eq("is_active", true)
    .lte("minutes", 5)
    .order("minutes");
  return data ?? [];
}
