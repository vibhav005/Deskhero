import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLegacyBridgeProfile } from "@/lib/queries/legacy-bridge";
import { LegacyStoreBridge } from "@/components/app/legacy-store-bridge";
import { Sidebar } from "@/components/nav/sidebar";
import { BottomNav } from "@/components/nav/bottom-nav";

/**
 * Shared shell for the signed-in experience. A real Server Component gate:
 * redirects to /auth/login if there's no session (defense in depth —
 * middleware already blocks this), to /auth/verify-email if the email isn't
 * confirmed yet, and to /onboarding if onboarding_completed_at is still null.
 * Can't be bypassed by disabling JS, and there's no client-side redirect flash.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");
  if (!user.email_confirmed_at) redirect("/auth/verify-email");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_completed_at) redirect("/onboarding");

  const legacyProfile = await getLegacyBridgeProfile();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl">
      <Sidebar />
      <div className="flex-1">
        <main
          id="main"
          className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6 md:max-w-3xl md:px-8 md:pb-12"
        >
          {legacyProfile ? (
            <LegacyStoreBridge profile={legacyProfile}>{children}</LegacyStoreBridge>
          ) : (
            children
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
