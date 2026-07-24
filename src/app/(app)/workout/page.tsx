"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { getQuestById } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useTimer } from "@/hooks/use-timer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/app/score-ring";
import { iconFor } from "@/components/app/icon";
import type { WorkoutStep } from "@/lib/types";
import { formatTime, cn } from "@/lib/utils";

function WorkoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const questId = params.get("quest") ?? "mobility-5";
  const quest = getQuestById(questId);
  const { completeQuest } = useStore();

  const steps: WorkoutStep[] = useMemo(() => quest?.workout ?? [], [quest]);
  const [index, setIndex] = useState(0);
  const [showEasier, setShowEasier] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = steps[index];
  const isTimed = typeof current?.seconds === "number";

  const timer = useTimer({ seconds: current?.seconds ?? 30 });

  // Reset the timer whenever the step changes.
  useEffect(() => {
    if (current?.seconds) timer.reset(current.seconds);
    setShowEasier(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!quest || steps.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg font-semibold">Workout not found</p>
        <Link href="/quests" className={buttonVariants({ variant: "outline" })}>
          Back to library
        </Link>
      </div>
    );
  }

  const StepIcon = iconFor(current.icon);
  const isLast = index === steps.length - 1;
  const progress = ((index + 1) / steps.length) * 100;

  function goNext() {
    if (index < steps.length - 1) setIndex((i) => i + 1);
  }
  function goPrev() {
    if (index > 0) setIndex((i) => i - 1);
  }
  function completeWorkout() {
    if (!quest) return;
    completeQuest(quest.id);
    setFinished(true);
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
          <h1 className="text-2xl font-extrabold">Workout complete!</h1>
          <p className="mt-2 text-muted-foreground">
            You earned {quest.xp} XP. Let&apos;s build on today.
          </p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-2">
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            Back to dashboard
          </Link>
          <Link
            href="/quests"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
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
          <p className="truncate text-sm text-muted-foreground">{quest.title}</p>
          <p className="text-xs text-muted-foreground">
            Exercise {index + 1} of {steps.length}
          </p>
        </div>
        <Link
          href={`/quests/${quest.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden />
          Quit
        </Link>
      </header>

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
            <h1 className="text-2xl font-extrabold tracking-tight">
              {current.name}
            </h1>

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
              <div className="grid h-[150px] w-[150px] place-items-center rounded-full border-8 border-primary-soft">
                <div>
                  <p className="text-4xl font-extrabold">{current.reps}</p>
                  <p className="text-xs text-muted-foreground">reps</p>
                </div>
              </div>
            )}

            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {current.instruction}
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
                  onClick={() => timer.reset(current.seconds)}
                  aria-label="Reset timer"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            )}

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
                {current.easier}
              </p>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Step navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="lg"
          onClick={goPrev}
          disabled={index === 0}
          className="flex-1"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
          Previous
        </Button>
        {isLast ? (
          <Button
            variant="success"
            size="lg"
            onClick={completeWorkout}
            className="flex-1"
          >
            <Check className="h-5 w-5" aria-hidden />
            Complete
          </Button>
        ) : (
          <Button size="lg" onClick={goNext} className="flex-1">
            Next
            <ChevronRight className="h-5 w-5" aria-hidden />
          </Button>
        )}
      </div>

      {/* Step dots */}
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

export default function WorkoutPage() {
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center py-20 text-muted-foreground">
          Loading workout…
        </div>
      }
    >
      <WorkoutContent />
    </Suspense>
  );
}
