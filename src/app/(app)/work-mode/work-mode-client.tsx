"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Bell,
  BellOff,
  Check,
  Coffee,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  Timer,
} from "lucide-react";
import { useTimer } from "@/hooks/use-timer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Callout } from "@/components/ui/callout";
import { ScoreRing } from "@/components/app/score-ring";
import { categoryIcon, CATEGORY_LABEL } from "@/components/app/icon";
import { startWorkSession, completeBreak, skipBreak, endSessionEarly } from "@/lib/actions/workmode";
import { formatTime, cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Activity = Database["public"]["Tables"]["activities"]["Row"];
type Phase = "idle" | "focus" | "break";

const SESSION_OPTIONS = [25, 45, 60] as const;
const BREAK_SECONDS = 120;

export function WorkModeClient({ breakActivities }: { breakActivities: Activity[] }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [minutes, setMinutes] = useState<number>(25);
  const [customMinutes, setCustomMinutes] = useState("");
  const [muted, setMuted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedBreakId, setSelectedBreakId] = useState<string | null>(null);
  const [breakDone, setBreakDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const focus = useTimer({
    seconds: minutes * 60,
    onComplete: () => setPhase("break"),
  });
  const breakTimer = useTimer({ seconds: BREAK_SECONDS });

  useEffect(() => {
    if (phase === "break") {
      breakTimer.reset(BREAK_SECONDS);
      breakTimer.start();
      setBreakDone(false);
      setSelectedBreakId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function startFocus(mins: number) {
    setError(null);
    setMinutes(mins);
    startTransition(async () => {
      const result = await startWorkSession({ plannedMinutes: mins });
      if (!result.ok || !result.sessionId) {
        setError(result.message ?? "Could not start session.");
        return;
      }
      setSessionId(result.sessionId);
      focus.reset(mins * 60);
      setPhase("focus");
      setTimeout(() => focus.start(), 0);
    });
  }

  function handleEndEarly() {
    focus.reset(minutes * 60);
    setPhase("idle");
    if (sessionId) {
      const id = sessionId;
      startTransition(async () => {
        await endSessionEarly({ workSessionId: id });
      });
    }
    setSessionId(null);
  }

  function handleCompleteBreak() {
    if (!sessionId || !selectedBreakId || breakDone) return;
    setError(null);
    startTransition(async () => {
      const result = await completeBreak({ workSessionId: sessionId, activityId: selectedBreakId });
      if (result.ok) {
        setBreakDone(true);
        setPhase("idle");
        setSessionId(null);
      } else {
        setError(result.message ?? "Could not complete the break.");
      }
    });
  }

  function handleSkipBreak() {
    setPhase("idle");
    if (sessionId) {
      const id = sessionId;
      startTransition(async () => {
        await skipBreak({ workSessionId: id });
      });
    }
    setSessionId(null);
  }

  const selectedActivity = breakActivities.find((a) => a.id === selectedBreakId);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Work Mode</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Focus in calm blocks, then take a short movement break.
          </p>
        </div>
        <Button
          variant={muted ? "secondary" : "outline"}
          size="sm"
          onClick={() => setMuted((m) => !m)}
          aria-pressed={muted}
        >
          {muted ? (
            <>
              <BellOff className="h-4 w-4" aria-hidden /> Muted
            </>
          ) : (
            <>
              <Bell className="h-4 w-4" aria-hidden /> Reminders on
            </>
          )}
        </Button>
      </header>

      {error && (
        <p role="alert" className="rounded-xl bg-warning-soft px-3 py-2 text-sm text-[hsl(var(--warning))]">
          {error}
        </p>
      )}

      {phase === "idle" && (
        <>
          <Card className="p-5">
            <p className="mb-3 font-semibold">Choose a focus session</p>
            <div className="grid grid-cols-3 gap-3">
              {SESSION_OPTIONS.map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    setMinutes(mins);
                    setCustomMinutes("");
                  }}
                  aria-pressed={minutes === mins && !customMinutes}
                  className={cn(
                    "rounded-2xl border-2 p-4 text-center transition-all",
                    minutes === mins && !customMinutes
                      ? "border-primary bg-primary-soft/70 shadow-soft"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <p className="text-2xl font-extrabold">{mins}</p>
                  <p className="text-xs text-muted-foreground">minutes</p>
                </button>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              Custom (15-90 min):
              <input
                type="number"
                min={15}
                max={90}
                value={customMinutes}
                onChange={(e) => {
                  setCustomMinutes(e.target.value);
                  const n = Number(e.target.value);
                  if (n >= 15 && n <= 90) setMinutes(n);
                }}
                placeholder="e.g. 40"
                className="w-24 rounded-lg border border-border bg-surface px-2 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <Button
              size="lg"
              className="mt-4 w-full"
              onClick={() => startFocus(minutes)}
              disabled={pending || minutes < 15 || minutes > 90}
            >
              <Play className="h-5 w-5" aria-hidden />
              Start {minutes}-minute session
            </Button>
          </Card>

          <Callout icon={Timer} tone="primary">
            When your session ends, DeskHero will suggest a short movement break — pick
            posture, eye-care, hydration, or a walk.
          </Callout>
        </>
      )}

      {phase === "focus" && (
        <Card className="flex flex-col items-center gap-5 p-6">
          <ScoreRing value={focus.progress * 100} size={200} strokeWidth={14}>
            <div className="text-center">
              <p className="text-4xl font-extrabold tabular-nums">{formatTime(focus.remaining)}</p>
              <p className="text-xs text-muted-foreground">
                {focus.running ? "Focusing" : "Paused"}
              </p>
            </div>
          </ScoreRing>

          <div className="flex w-full items-center justify-center gap-2">
            <Button
              variant={focus.running ? "secondary" : "default"}
              size="lg"
              onClick={focus.toggle}
              className="flex-1"
            >
              {focus.running ? (
                <>
                  <Pause className="h-5 w-5" aria-hidden /> Pause
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" aria-hidden /> Resume
                </>
              )}
            </Button>
            <Button variant="outline" size="icon" onClick={handleEndEarly} aria-label="End session">
              <RotateCcw className="h-5 w-5" aria-hidden />
            </Button>
          </div>

          <button
            onClick={() => setPhase("break")}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <FastForward className="h-4 w-4" aria-hidden />
            Skip to break (demo)
          </button>
        </Card>
      )}

      {phase === "break" && (
        <>
          <Card className="flex flex-col items-center gap-4 p-6 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-accent-soft text-accent">
              <Coffee className="h-8 w-8" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold">Time for a movement break</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Nice focus session! Pick one and give your body a reset.
              </p>
            </div>
            <ScoreRing value={breakTimer.progress * 100} size={120} strokeWidth={10}>
              <p className="text-2xl font-extrabold tabular-nums">
                {formatTime(breakTimer.remaining)}
              </p>
            </ScoreRing>
            <Button variant="outline" size="sm" onClick={breakTimer.toggle}>
              {breakTimer.running ? (
                <>
                  <Pause className="h-4 w-4" aria-hidden /> Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" aria-hidden /> Resume
                </>
              )}
            </Button>
          </Card>

          <Card className="p-5">
            <p className="mb-3 font-semibold">Pick your break</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {breakActivities.map((a) => {
                const Icon = categoryIcon(a.category as never);
                const selected = selectedBreakId === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedBreakId(a.id)}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-all",
                      selected
                        ? "border-primary bg-primary-soft/70 shadow-soft"
                        : "border-border bg-muted/40 hover:border-primary/40",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{a.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {CATEGORY_LABEL[a.category as never]} · {a.xp_value} XP
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="lg" onClick={handleSkipBreak} className="flex-1">
              Skip break
            </Button>
            <Button
              variant="success"
              size="lg"
              onClick={handleCompleteBreak}
              disabled={!selectedActivity || pending}
              className="flex-1"
            >
              <Check className="h-5 w-5" aria-hidden />
              {selectedActivity ? `Complete break · +${selectedActivity.xp_value} XP` : "Pick a break"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
