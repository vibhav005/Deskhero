"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { LogoMark } from "@/components/app/logo";
import type { UserProfile } from "@/lib/types";

/**
 * Ensures the legacy localStorage store has *some* profile before
 * not-yet-migrated pages (dashboard/quests/achievements/etc.) render — without
 * this, any fresh session (new device, cleared cache, second browser) has an
 * empty local store and those pages crash on `state.profile!.name`.
 *
 * Gates rendering of `children` until the store is confirmed ready and
 * bridged (hydration is async, so a fire-and-forget effect isn't enough —
 * the first render would still see a null profile). Never overwrites
 * existing local progress. Temporary — remove once those pages read
 * Supabase directly.
 */
export function LegacyStoreBridge({
  profile,
  children,
}: {
  profile: UserProfile;
  children: React.ReactNode;
}) {
  const { state, ready, completeOnboarding } = useStore();
  const attempted = useRef(false);

  useEffect(() => {
    if (!ready || attempted.current || state.onboarded) return;
    attempted.current = true;
    completeOnboarding(profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, state.onboarded]);

  if (!ready || !state.onboarded) {
    return (
      <div className="grid min-h-dvh flex-1 place-items-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <LogoMark className="h-12 w-12 animate-pop" />
          <p className="text-sm">Loading your quests…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
