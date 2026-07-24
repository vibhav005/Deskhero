"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { Sidebar } from "@/components/nav/sidebar";
import { BottomNav } from "@/components/nav/bottom-nav";
import { LogoMark } from "@/components/app/logo";

/**
 * Shared shell for the signed-in prototype experience.
 * Redirects to onboarding if the user hasn't set up a profile yet.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { state, ready } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (ready && !state.onboarded) {
      router.replace("/");
    }
  }, [ready, state.onboarded, router]);

  if (!ready || !state.onboarded) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <LogoMark className="h-12 w-12 animate-pop" />
          <p className="text-sm">Loading your quests…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl">
      <Sidebar />
      <div className="flex-1">
        <main
          id="main"
          className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6 md:max-w-3xl md:px-8 md:pb-12"
        >
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
