"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Dumbbell,
  Info,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  ShieldAlert,
  SkipForward,
  Zap,
} from "lucide-react";
import { useTimer } from "@/hooks/use-timer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { ScoreRing } from "@/components/app/score-ring";
import { categoryIcon, CATEGORY_LABEL } from "@/components/app/icon";
import { completeQuest, skipQuest, replaceQuest } from "@/lib/actions/quests";
import { formatTime, cn } from "@/lib/utils";
import type { ActivityDetail } from "@/lib/queries/quest-library";

const DIFFICULTY_LABEL = {
  easy: "Easy",
  moderate: "Moderate",
  challenging: "Challenging",
} as const;

export function QuestDetailClient({ detail }: { detail: ActivityDetail }) {
  const { activity, dailyQuestId, status } = detail;
  const router = useRouter();
  const [showEasier, setShowEasier] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const alreadyDone = status === "completed";
  const isTodaysQuest = dailyQuestId !== null && status === "assigned";

  const timer = useTimer({ seconds: activity.timer_seconds ?? 60 });

  const Icon = categoryIcon(activity.category as never);
  const isTimed = typeof activity.timer_seconds === "number";
  const isWorkout = activity.workout_id !== null;

  function handleComplete() {
    if (!dailyQuestId || alreadyDone) return;
    setError(null);
    startTransition(async () => {
      const result = await completeQuest({ dailyQuestId });
      if (result.ok) router.push("/dashboard");
      else setError(result.message ?? "Could not complete this quest.");
    });
  }

  function handleSkip() {
    if (!dailyQuestId) return;
    setError(null);
    startTransition(async () => {
      const result = await skipQuest({ dailyQuestId });
      if (result.ok) router.push("/dashboard");
      else setError(result.message ?? "Could not skip this quest.");
    });
  }

  function handleReplace() {
    if (!dailyQuestId) return;
    setError(null);
    startTransition(async () => {
      const result = await replaceQuest({ dailyQuestId });
      if (result.ok) router.push("/dashboard");
      else setError(result.message ?? "No suitable replacement available right now.");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <button
        onClick={() => router.back()}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back
      </button>

      <header className="flex items-start gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
          <Icon className="h-7 w-7" aria-hidden />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight">
            {activity.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{activity.summary}</p>
        </div>
      </header>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="muted">{CATEGORY_LABEL[activity.category as never]}</Badge>
        <Badge variant="outline">{DIFFICULTY_LABEL[activity.difficulty as keyof typeof DIFFICULTY_LABEL]}</Badge>
        <Badge variant="muted">
          <Clock className="h-3 w-3" aria-hidden /> {activity.minutes} min
        </Badge>
        <Badge variant="default">
          <Zap className="h-3 w-3" aria-hidden /> {activity.xp_value} XP
        </Badge>
      </div>

      {alreadyDone && (
        <Callout icon={Check} tone="success">
          You already completed this today. Nicely done!
        </Callout>
      )}

      {isWorkout && (
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Dumbbell className="h-6 w-6 text-primary" aria-hidden />
            <div>
              <p className="font-semibold">Guided workout</p>
              <p className="text-sm text-muted-foreground">
                Follow along step by step, at your own pace.
              </p>
            </div>
          </div>
          <Link
            href={`/workout?quest=${activity.slug}`}
            className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full")}
          >
            <Play className="h-5 w-5" aria-hidden />
            Start guided workout
          </Link>
        </Card>
      )}

      {isTimed && !isWorkout && (
        <Card className="flex flex-col items-center gap-4 p-6">
          <ScoreRing value={timer.progress * 100} size={160} strokeWidth={12}>
            <div className="text-center">
              <p className="text-3xl font-extrabold tabular-nums">{formatTime(timer.remaining)}</p>
              <p className="text-xs text-muted-foreground">
                {timer.finished ? "Complete!" : timer.running ? "Keep going" : "Ready"}
              </p>
            </div>
          </ScoreRing>

          <div className="flex w-full items-center justify-center gap-2">
            <Button
              variant={timer.running ? "secondary" : "default"}
              size="lg"
              onClick={timer.toggle}
              disabled={timer.finished}
              className="flex-1"
            >
              {timer.running ? (
                <>
                  <Pause className="h-5 w-5" aria-hidden /> Pause
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" aria-hidden /> Start
                </>
              )}
            </Button>
            <Button variant="outline" size="icon" onClick={() => timer.reset()} aria-label="Reset timer">
              <RotateCcw className="h-5 w-5" aria-hidden />
            </Button>
          </div>
        </Card>
      )}

      <section>
        <h2 className="mb-2 text-lg font-bold">How to do it</h2>
        <Card className="p-5">
          <ol className="flex flex-col gap-3">
            {activity.instructions.map((line, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed">{line}</span>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      {activity.easier_alternative && (
        <Card className="p-4">
          <button
            onClick={() => setShowEasier((v) => !v)}
            aria-expanded={showEasier}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <span className="inline-flex items-center gap-2 font-semibold">
              <Info className="h-5 w-5 text-primary" aria-hidden />
              Need an easier option?
            </span>
            <span className="text-sm text-muted-foreground">{showEasier ? "Hide" : "Show"}</span>
          </button>
          {showEasier && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {activity.easier_alternative}
            </p>
          )}
        </Card>
      )}

      {activity.safety_notes && (
        <Callout icon={ShieldAlert} tone="warning" title="Safety guidance">
          {activity.safety_notes}
        </Callout>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-warning-soft px-3 py-2 text-sm text-[hsl(var(--warning))]">
          {error}
        </p>
      )}

      {isTodaysQuest && (
        <>
          <Button
            size="lg"
            variant="success"
            onClick={handleComplete}
            disabled={pending}
            className="w-full"
          >
            <Check className="h-5 w-5" aria-hidden />
            Complete · +{activity.xp_value} XP
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="lg" onClick={handleSkip} disabled={pending} className="flex-1">
              <SkipForward className="h-4 w-4" aria-hidden />
              Skip
            </Button>
            <Button variant="outline" size="lg" onClick={handleReplace} disabled={pending} className="flex-1">
              <Shuffle className="h-4 w-4" aria-hidden />
              Replace
            </Button>
          </div>
        </>
      )}
      {alreadyDone && (
        <Button size="lg" variant="secondary" disabled className="w-full">
          Already completed today
        </Button>
      )}
    </div>
  );
}
