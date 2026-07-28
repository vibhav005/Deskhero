"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Pause,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import { useTimer } from "@/hooks/use-timer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/app/score-ring";
import { Callout } from "@/components/ui/callout";
import { iconFor } from "@/components/app/icon";
import { completeQuest } from "@/lib/actions/quests";
import { formatTime, cn } from "@/lib/utils";
import type { ActivityDetail, WorkoutStepRow } from "@/lib/queries/quest-library";

export function WorkoutPlayer({
  detail,
  steps,
}: {
  detail: ActivityDetail;
  steps: WorkoutStepRow[];
}) {
  const { activity, dailyQuestId, status } = detail;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [showEasier, setShowEasier] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = steps[index];
  const isTimed = typeof current?.seconds === "number";
  const timer = useTimer({ seconds: current?.seconds ?? 30 });

  useEffect(() => {
    if (current?.seconds) timer.reset(current.seconds);
    setShowEasier(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const StepIcon = useMemo(() => iconFor(current?.exercise.icon ?? "activity"), [current]);
  const isLast = index === steps.length - 1;
  const progress = ((index + 1) / steps.length) * 100;
  const alreadyDone = status === "completed";
  const partOfToday = dailyQuestId !== null && status === "assigned";

  function goNext() {
    if (index < steps.length - 1) setIndex((i) => i + 1);
  }
  function goPrev() {
    if (index > 0) setIndex((i) => i - 1);
  }

  function completeWorkout() {
    if (!partOfToday || !dailyQuestId) {
      setFinished(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await completeQuest({ dailyQuestId });
      if (result.ok) setFinished(true);
      else setError(result.message ?? "Could not complete this workout.");
    });
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-5 py-16 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="grid h-24 w-24 place-items-center rounded-full bg-success-soft text-success"
        >
          <Check className="h-12 w-12" aria-hidden />
        </motion.div>
        <div>
          <h1 className="font-display text-2xl font-semibold">Workout complete!</h1>
          <p className="mt-2 text-muted-foreground">
            {partOfToday
              ? `You earned ${activity.xp_value} XP. Let's build on today.`
              : "Nice practice run — this workout wasn't part of today's plan, so no XP was awarded."}
          </p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-2">
          <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
            Back to dashboard
          </Link>
          <Link href="/quests" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            Browse more quests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{activity.title}</p>
          <p className="text-xs text-muted-foreground">
            Exercise {index + 1} of {steps.length}
          </p>
        </div>
        <Link
          href={`/quests/${activity.slug}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden />
          Quit
        </Link>
      </header>

      {alreadyDone && (
        <Callout icon={Check} tone="success">
          You already completed this today. Nicely done!
        </Callout>
      )}
      {!partOfToday && !alreadyDone && (
        <Callout tone="neutral">
          This workout isn&apos;t part of today&apos;s plan — you can still practice, but it
          won&apos;t award XP.
        </Callout>
      )}

      <Progress value={progress} label={`Workout progress ${Math.round(progress)}%`} />

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="flex flex-col items-center gap-4 p-6 text-center">
            <span className="grid h-20 w-20 place-items-center rounded-3xl bg-primary-soft text-primary">
              <StepIcon className="h-10 w-10" aria-hidden />
            </span>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{current.exercise.name}</h1>

            {isTimed ? (
              <ScoreRing value={timer.progress * 100} size={150} strokeWidth={11}>
                <div>
                  <p className="text-3xl font-extrabold tabular-nums">
                    {formatTime(timer.remaining)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {timer.finished ? "Done" : timer.running ? "Go" : "Ready"}
                  </p>
                </div>
              </ScoreRing>
            ) : (
              <div className="grid h-[150px] w-[150px] place-items-center rounded-full border-[10px] border-primary/25">
                <div>
                  <p className="text-4xl font-extrabold tabular-nums">{current.reps}</p>
                  <p className="text-xs text-muted-foreground">reps</p>
                </div>
              </div>
            )}

            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {current.exercise.instruction}
            </p>

            {isTimed && (
              <div className="flex items-center gap-2">
                <Button
                  variant={timer.running ? "secondary" : "default"}
                  onClick={timer.toggle}
                  disabled={timer.finished}
                >
                  {timer.running ? (
                    <>
                      <Pause className="h-4 w-4" aria-hidden /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" aria-hidden /> Start
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => timer.reset(current.seconds ?? 30)}
                  aria-label="Reset timer"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            )}

            {current.exercise.easier_variant && (
              <>
                <button
                  onClick={() => setShowEasier((v) => !v)}
                  aria-expanded={showEasier}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
                >
                  <Info className="h-4 w-4" aria-hidden />
                  {showEasier ? "Hide easier version" : "Show easier version"}
                </button>
                {showEasier && (
                  <p className="max-w-sm rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                    {current.exercise.easier_variant}
                  </p>
                )}
              </>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {error && (
        <p role="alert" className="rounded-xl bg-warning-soft px-3 py-2 text-sm text-[hsl(var(--warning))]">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button variant="outline" size="lg" onClick={goPrev} disabled={index === 0} className="flex-1">
          <ChevronLeft className="h-5 w-5" aria-hidden />
          Previous
        </Button>
        {isLast ? (
          <Button
            variant="success"
            size="lg"
            onClick={completeWorkout}
            disabled={pending || alreadyDone}
            className="flex-1"
          >
            <Check className="h-5 w-5" aria-hidden />
            {alreadyDone ? "Already completed" : "Complete"}
          </Button>
        ) : (
          <Button size="lg" onClick={goNext} className="flex-1">
            Next
            <ChevronRight className="h-5 w-5" aria-hidden />
          </Button>
        )}
      </div>

      <div className="flex justify-center gap-1.5" aria-hidden>
        {steps.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 rounded-full transition-all",
              i === index ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30",
            )}
          />
        ))}
      </div>
    </div>
  );
}
