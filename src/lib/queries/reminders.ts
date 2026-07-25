import { createClient } from "@/lib/supabase/server";

export async function getReminderPreferences() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("reminder_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}
