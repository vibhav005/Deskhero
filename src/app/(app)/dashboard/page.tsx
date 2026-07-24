"use client";

import { AnimatedCounter } from "@/components/app/animated-counter";
import { CATEGORY_LABEL, categoryIcon, iconFor } from "@/components/app/icon";
import { PixelHero } from "@/components/app/pixel-hero";
import { ScoreRing } from "@/components/app/score-ring";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ACHIEVEMENTS, getQuestById } from "@/lib/data";
import { dailyScore, levelForXp, weeklyConsistency } from "@/lib/logic";
import { useStore, useTodayCompleted } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Award, CalendarCheck, Check, ChevronRight, Flame, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { state, completeQuest } = useStore();
  const router = useRouter();
  const completed = useTodayCompleted();

  const profile = state.profile!;
  const lvl = levelForXp(state.xp);
  const todayQuests = state.todayQuestIds
    .map((id) => getQuestById(id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q));

  const doneCount = todayQuests.filter((q) => completed.includes(q.id)).length;
  const score = dailyScore(doneCount, todayQuests.length);
  const consistency = weeklyConsistency(state.history, doneCount > 0);
  const nextQuest = todayQuests.find((q) => !completed.includes(q.id));

  const recentAchievement = state.unlockedAchievements.length
    ? ACHIEVEMENTS.find((a) => a.id === state.unlockedAchievements[state.unlockedAchievements.length - 1])
    : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-5">
      {/* Greeting + level */}
      <header>
        <p className="text-sm text-muted-foreground">{greeting},</p>
        <h1 className="text-2xl font-extrabold tracking-tight">{profile.name} 👋</h1>
      </header>

      {/* Level / XP card */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <PixelHero level={lvl.level} size={64} />
            <div>
              <Badge variant="default" className="mb-2">
                Level {lvl.level}
              </Badge>
              <p className="text-xl font-bold">{lvl.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {lvl.next ? `${lvl.xpForNext} XP to ${lvl.next.name}` : "Top level reached — amazing!"}
              </p>
            </div>
          </div>
          <ScoreRing value={score} label={`Daily health score ${score} of 100`}>
            <div className="text-center">
              <p className="text-xl font-extrabold leading-none">
                <AnimatedCounter value={score} />
              </p>
              <p className="text-[10px] font-medium text-muted-foreground">score</p>
            </div>
          </ScoreRing>
        </div>
        <div className="px-5 pb-5">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <AnimatedCounter value={state.xp} suffix=" XP" />
            </span>
            <span>{Math.round(lvl.progress * 100)}%</span>
          </div>
          <Progress value={lvl.progress * 100} label="Level progress" />
        </div>
      </Card>

      {/* Streak + consistency */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-accent">
            <Flame className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-xl font-bold leading-none">
              <AnimatedCounter value={state.streak} />
              <span className="ml-1 text-sm font-medium text-muted-foreground">
                day{state.streak === 1 ? "" : "s"}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Current streak</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary">
            <CalendarCheck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-xl font-bold leading-none">
              <AnimatedCounter value={consistency} suffix="%" />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Weekly rhythm</p>
          </div>
        </Card>
      </div>

      {/* Today's quests */}
      <section aria-labelledby="today-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="today-heading" className="text-lg font-bold">
            Today&apos;s quests
          </h2>
          <span className="text-sm font-medium text-muted-foreground">
            {doneCount} of {todayQuests.length} done
          </span>
        </div>

        {nextQuest ? (
          <Button size="lg" className="mb-3 w-full" onClick={() => router.push(`/quests/${nextQuest.id}`)}>
            <Play className="h-5 w-5" aria-hidden />
            Start next quest · {nextQuest.title}
          </Button>
        ) : (
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-success-soft p-4 text-success">
            <Sparkles className="h-5 w-5" aria-hidden />
            <p className="text-sm font-semibold">
              You completed all {todayQuests.length} quests. Let&apos;s build on today!
            </p>
          </div>
        )}

        <ul className="flex flex-col gap-2.5">
          {todayQuests.map((quest, i) => {
            const isDone = completed.includes(quest.id);
            const Icon = categoryIcon(quest.category);
            return (
              <motion.li
                key={quest.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <Card
                  className={cn(
                    "flex items-center gap-3 p-3 transition-colors",
                    isDone && "bg-success-soft/40",
                  )}
                >
                  <Link href={`/quests/${quest.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className={cn(
                        "grid h-11 w-11 shrink-0 place-items-center rounded-full",
                        isDone ? "bg-success text-success-foreground" : "bg-primary-soft text-primary",
                      )}
                    >
                      {isDone ? (
                        <Check className="h-5 w-5" aria-hidden />
                      ) : (
                        <Icon className="h-5 w-5" aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block truncate text-sm font-semibold",
                          isDone && "text-muted-foreground line-through",
                        )}
                      >
                        {quest.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {CATEGORY_LABEL[quest.category]} · {quest.minutes} min · {quest.xp} XP
                      </span>
                    </span>
                  </Link>
                  {isDone ? (
                    <span className="shrink-0 pr-1 text-xs font-semibold text-success">Done</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="subtle"
                      onClick={() => completeQuest(quest.id)}
                      aria-label={`Mark ${quest.title} complete`}
                    >
                      Complete
                    </Button>
                  )}
                </Card>
              </motion.li>
            );
          })}
        </ul>
      </section>

      {/* Recent achievement */}
      {recentAchievement && (
        <Link href="/achievements">
          <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/40">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
              {(() => {
                const Icon = iconFor(recentAchievement.icon);
                return <Icon className="h-6 w-6" aria-hidden />;
              })()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Recent achievement</p>
              <p className="truncate font-semibold">{recentAchievement.name}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          </Card>
        </Link>
      )}

      {/* Encouraging footer + quick link */}
      <Card className="flex items-center gap-3 bg-primary-soft/50 p-4">
        <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p className="text-sm font-medium text-foreground">
          Every movement counts. A small step is still progress.
        </p>
      </Card>

      <Link href="/achievements" className={cn(buttonVariants({ variant: "ghost" }), "justify-between")}>
        <span className="inline-flex items-center gap-2">
          <Award className="h-5 w-5" aria-hidden />
          View all achievements
        </span>
        <ChevronRight className="h-5 w-5" aria-hidden />
      </Link>
    </div>
  );
}
