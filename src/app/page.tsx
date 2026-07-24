import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WelcomeContent } from "./welcome-content";

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", user.id)
      .single();

    redirect(profile?.onboarding_completed_at ? "/dashboard" : "/onboarding");
  }

  return <WelcomeContent />;
}
