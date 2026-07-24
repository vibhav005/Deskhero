import Link from "next/link";
import { Award, CalendarCheck, ChevronRight, Flame, Play, Sparkles } from "lucide-react";
import { getDashboardData } from "@/lib/queries/dashboard";
import { generateDailyPlan } from "@/lib/actions/quests";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/app/score-ring";
import { AnimatedCounter } from "@/components/app/animated-counter";
import { PixelHero } from "@/components/app/pixel-hero";
import { cn } from "@/lib/utils";
import { QuestList } from "./quest-list";

export default async function DashboardPage() {
  let data = await getDashboardData();
  if (data && !data.hasPlanToday) {
    await generateDailyPlan();
    data = await getDashboardData();
  }
  if (!data) return null;

  const {
    displayName,
    xp,
    level,
    streak,
    weeklyConsistency,
    quests,
    doneCount,
    score,
    recentAchievement,
  } = data;

  const nextQuest = quests.find((q) => q.status === "assigned");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-sm text-muted-foreground">{greeting},</p>
        <h1 className="text-2xl font-extrabold tracking-tight">{displayName} 👋</h1>
      </header>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <PixelHero level={level.level} size={64} />
            <div>
              <Badge variant="default" className="mb-2">
                Level {level.level}
              </Badge>
              <p className="text-xl font-bold">{level.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {level.next
                  ? `${level.xpForNext} XP to ${level.next.name}`
                  : "Top level reached — amazing!"}
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
              <AnimatedCounter value={xp} suffix=" XP" />
            </span>
            <span>{Math.round(level.progress * 100)}%</span>
          </div>
          <Progress value={level.progress * 100} label="Level progress" />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-accent">
            <Flame className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-xl font-bold leading-none">
              <AnimatedCounter value={streak} />
              <span className="ml-1 text-sm font-medium text-muted-foreground">
                day{streak === 1 ? "" : "s"}
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
              <AnimatedCounter value={weeklyConsistency} suffix="%" />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Weekly rhythm</p>
          </div>
        </Card>
      </div>

      <section aria-labelledby="today-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="today-heading" className="text-lg font-bold">
            Today&apos;s quests
          </h2>
          <span className="text-sm font-medium text-muted-foreground">
            {doneCount} of {quests.length} done
          </span>
        </div>

        {nextQuest ? (
          <Link
            href={`/quests/${nextQuest.activity.slug}`}
            className={cn(buttonVariants({ size: "lg" }), "mb-3 w-full")}
          >
            <Play className="h-5 w-5" aria-hidden />
            Start next quest · {nextQuest.activity.title}
          </Link>
        ) : quests.length > 0 ? (
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-success-soft p-4 text-success">
            <Sparkles className="h-5 w-5" aria-hidden />
            <p className="text-sm font-semibold">
              You completed all {quests.length} quests. Let&apos;s build on today!
            </p>
          </div>
        ) : null}

        <QuestList quests={quests} />
      </section>

      {recentAchievement && (
        <Link href="/achievements">
          <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/40">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
              <Award className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Recent achievement</p>
              <p className="truncate font-semibold">{recentAchievement.name}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          </Card>
        </Link>
      )}

      <Card className="flex items-center gap-3 bg-primary-soft/50 p-4">
        <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p className="text-sm font-medium text-foreground">
          Every movement counts. A small step is still progress.
        </p>
      </Card>

      <Link
        href="/achievements"
        className={cn(buttonVariants({ variant: "ghost" }), "justify-between")}
      >
        <span className="inline-flex items-center gap-2">
          <Award className="h-5 w-5" aria-hidden />
          View all achievements
        </span>
        <ChevronRight className="h-5 w-5" aria-hidden />
      </Link>
    </div>
  );
}
