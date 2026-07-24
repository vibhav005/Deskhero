"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Dumbbell,
  Info,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { getQuestById } from "@/lib/data";
import { useStore, useTodayCompleted } from "@/lib/store";
import { useTimer } from "@/hooks/use-timer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/app/score-ring";
import { categoryIcon, CATEGORY_LABEL } from "@/components/app/icon";
import { formatTime, cn } from "@/lib/utils";

const DIFFICULTY_LABEL = {
  easy: "Easy",
  moderate: "Moderate",
  challenging: "Challenging",
} as const;

export default function QuestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const quest = getQuestById(params.id);
  const { completeQuest } = useStore();
  const completedToday = useTodayCompleted();
  const [showEasier, setShowEasier] = useState(false);

  const alreadyDone = quest ? completedToday.includes(quest.id) : false;

  const timer = useTimer({
    seconds: quest?.timerSeconds ?? 60,
  });

  if (!quest) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg font-semibold">Quest not found</p>
        <Link href="/quests" className={buttonVariants({ variant: "outline" })}>
          Back to library
        </Link>
      </div>
    );
  }

  const Icon = categoryIcon(quest.category);
  const isTimed = typeof quest.timerSeconds === "number";
  const isWorkout = Boolean(quest.workout);

  function handleComplete() {
    if (!quest || alreadyDone) return;
    completeQuest(quest.id);
    router.push("/dashboard");
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
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight">
            {quest.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{quest.summary}</p>
        </div>
      </header>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="muted">{CATEGORY_LABEL[quest.category]}</Badge>
        <Badge variant="outline">{DIFFICULTY_LABEL[quest.difficulty]}</Badge>
        <Badge variant="muted">
          <Clock className="h-3 w-3" aria-hidden /> {quest.minutes} min
        </Badge>
        <Badge variant="default">
          <Zap className="h-3 w-3" aria-hidden /> {quest.xp} XP
        </Badge>
      </div>

      {alreadyDone && (
        <div className="flex items-center gap-2 rounded-2xl bg-success-soft p-3.5 text-success">
          <Check className="h-5 w-5" aria-hidden />
          <p className="text-sm font-semibold">
            You already completed this today. Nicely done!
          </p>
        </div>
      )}

      {/* Guided workout entry point */}
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
            href={`/workout?quest=${quest.id}`}
            className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full")}
          >
            <Play className="h-5 w-5" aria-hidden />
            Start guided workout
          </Link>
        </Card>
      )}

      {/* Timer for timed activities */}
      {isTimed && !isWorkout && (
        <Card className="flex flex-col items-center gap-4 p-6">
          <ScoreRing value={timer.progress * 100} size={160} strokeWidth={12}>
            <div className="text-center">
              <p className="text-3xl font-extrabold tabular-nums">
                {formatTime(timer.remaining)}
              </p>
              <p className="text-xs text-muted-foreground">
                {timer.finished
                  ? "Complete!"
                  : timer.running
                    ? "Keep going"
                    : "Ready"}
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
            <Button
              variant="outline"
              size="icon"
              onClick={() => timer.reset()}
              aria-label="Reset timer"
            >
              <RotateCcw className="h-5 w-5" aria-hidden />
            </Button>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <section>
        <h2 className="mb-2 text-lg font-bold">How to do it</h2>
        <Card className="p-5">
          <ol className="flex flex-col gap-3">
            {quest.instructions.map((line, i) => (
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

      {/* Easier alternative */}
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
          <span className="text-sm text-muted-foreground">
            {showEasier ? "Hide" : "Show"}
          </span>
        </button>
        {showEasier && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {quest.easierAlternative}
          </p>
        )}
      </Card>

      {/* Safety */}
      <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-soft p-4">
        <ShieldAlert
          className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--warning))]"
          aria-hidden
        />
        <div>
          <p className="text-sm font-semibold">Safety guidance</p>
          <p className="mt-0.5 text-sm leading-relaxed text-foreground">
            {quest.safety}
          </p>
        </div>
      </div>

      {/* Complete */}
      {!isWorkout && (
        <Button
          size="lg"
          variant={alreadyDone ? "secondary" : "success"}
          onClick={handleComplete}
          disabled={alreadyDone}
          className="w-full"
        >
          <Check className="h-5 w-5" aria-hidden />
          {alreadyDone ? "Already completed today" : `Complete · +${quest.xp} XP`}
        </Button>
      )}
    </div>
  );
}
