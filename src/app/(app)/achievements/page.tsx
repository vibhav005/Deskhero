"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { ACHIEVEMENTS } from "@/lib/data";
import { achievementProgress } from "@/lib/logic";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { iconFor } from "@/components/app/icon";
import { cn } from "@/lib/utils";

type Tier = "bronze" | "silver" | "gold";

/** Rarity tier by how hard the achievement is to earn. */
function tierFor(target: number): Tier {
  if (target >= 10) return "gold";
  if (target >= 4) return "silver";
  return "bronze";
}

const TIER_LABEL: Record<Tier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
};

export default function AchievementsPage() {
  const { state } = useStore();
  const reduced = state.settings.reducedMotion;

  const items = ACHIEVEMENTS.map((a) => {
    const progress = Math.min(
      a.target,
      achievementProgress(a, state.stats, state.history),
    );
    const unlocked = progress >= a.target;
    return { ...a, progress, unlocked };
  });

  const unlockedCount = items.filter((i) => i.unlocked).length;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Achievements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {unlockedCount} of {items.length} badges unlocked. Every one is a small
          win worth celebrating.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((a, i) => {
          const Icon = iconFor(a.icon);
          const pct = (a.progress / a.target) * 100;
          const tier = tierFor(a.target);
          return (
            <motion.div
              key={a.id}
              initial={reduced ? false : { opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: reduced ? 0 : i * 0.04, duration: 0.3, ease: "easeOut" }}
              whileHover={a.unlocked && !reduced ? { y: -2 } : undefined}
            >
              <Card
                data-tier={a.unlocked ? tier : undefined}
                className={cn(
                  "flex flex-col gap-3 p-4 transition-shadow",
                  a.unlocked ? "tier-glow hover:shadow-lift" : "opacity-90",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    data-tier={a.unlocked ? tier : undefined}
                    className={cn(
                      "relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl",
                      a.unlocked
                        ? "tier-glow bg-[var(--tier-color)] text-[hsl(200,30%,8%)]"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {a.unlocked && !reduced && (
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
                        animate={{ x: ["-100%", "150%"] }}
                        transition={{
                          delay: i * 0.04 + 0.3,
                          duration: 0.9,
                          ease: "easeInOut",
                        }}
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
                      <Badge variant={tier} className="shrink-0">
                        {TIER_LABEL[tier]}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {a.description}
                  </p>
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
