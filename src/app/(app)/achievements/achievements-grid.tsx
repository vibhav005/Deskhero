"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { iconFor } from "@/components/app/icon";
import { cn } from "@/lib/utils";
import type { AchievementWithProgress } from "@/lib/queries/achievements";

const TIER_LABEL: Record<AchievementWithProgress["tier"], string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
};

export function AchievementsGrid({ items }: { items: AchievementWithProgress[] }) {
  const { state } = useStore();
  const reduced = state.settings.reducedMotion;

  const recentlyUnlocked = items
    .filter((a) => a.unlocked && a.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      {recentlyUnlocked.length > 0 && (
        <div>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Recently unlocked
          </p>
          <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
            {recentlyUnlocked.map((a) => {
              const RecentIcon = iconFor(a.icon ?? "sparkles");
              return (
                <div
                  key={a.id}
                  data-tier={a.tier}
                  className="tier-glow flex shrink-0 items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5"
                >
                  <span
                    data-tier={a.tier}
                    className="tier-glow grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--tier-color)] text-[hsl(28,20%,10%)]"
                  >
                    <RecentIcon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="whitespace-nowrap text-sm font-medium">{a.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((a, i) => {
        const Icon = iconFor(a.icon ?? "sparkles");
        const pct = (a.progress / a.target) * 100;
        return (
          <motion.div
            key={a.id}
            initial={reduced ? false : { opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: reduced ? 0 : i * 0.04, duration: 0.3, ease: "easeOut" }}
            whileHover={a.unlocked && !reduced ? { y: -2 } : undefined}
          >
            <Card
              data-tier={a.unlocked ? a.tier : undefined}
              className={cn(
                "flex flex-col gap-3 p-4 transition-shadow",
                a.unlocked ? "tier-glow hover:shadow-lift" : "border-dashed opacity-75",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  data-tier={a.unlocked ? a.tier : undefined}
                  className={cn(
                    "relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl",
                    a.unlocked
                      ? "tier-glow bg-[var(--tier-color)] text-[hsl(28,20%,10%)]"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {a.unlocked && !reduced && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
                      animate={{ x: ["-100%", "150%"] }}
                      transition={{ delay: i * 0.04 + 0.3, duration: 0.9, ease: "easeInOut" }}
                    />
                  )}
                  <Icon className="h-7 w-7" aria-hidden />
                  {!a.unlocked && (
                    <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-card bg-surface text-muted-foreground">
                      <Lock className="h-3 w-3" aria-hidden />
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{a.name}</h2>
                    {a.unlocked && (
                      <Badge variant={a.tier} className="shrink-0">
                        {TIER_LABEL[a.tier]}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{a.description}</p>
                </div>
              </div>

              <div>
                <Progress
                  value={pct}
                  className="h-2"
                  indicatorClassName={
                    a.unlocked
                      ? "!bg-none bg-success shadow-[0_0_10px_hsl(var(--success)/0.5)]"
                      : undefined
                  }
                  label={`${a.name} progress`}
                />
                <p className="mt-1 text-right text-xs font-medium text-muted-foreground">
                  {a.progress} / {a.target}
                </p>
              </div>
            </Card>
          </motion.div>
        );
        })}
      </div>
    </div>
  );
}
