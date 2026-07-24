"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  BellOff,
  Check,
  Coffee,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useTimer } from "@/hooks/use-timer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScoreRing } from "@/components/app/score-ring";
import { formatTime, cn } from "@/lib/utils";
import { XP } from "@/lib/data";

type Phase = "idle" | "focus" | "break";

const SESSION_OPTIONS = [25, 45, 60] as const;
const BREAK_SECONDS = 120;

const BREAK_ACTIVITIES = [
  "Stand for two minutes",
  "Look away from the screen",
  "Stretch your chest",
  "Walk around the room",
  "Drink some water",
  "Do a few shoulder rolls",
];

export default function WorkModePage() {
  const { awardXp } = useStore();
  const [phase, setPhase] = useState<Phase>("idle");
  const [minutes, setMinutes] = useState<(typeof SESSION_OPTIONS)[number]>(25);
  const [muted, setMuted] = useState(false);
  const [breakDone, setBreakDone] = useState(false);

  const focus = useTimer({
    seconds: minutes * 60,
    onComplete: () => setPhase("break"),
  });
  const breakTimer = useTimer({ seconds: BREAK_SECONDS });

  // Start the break timer automatically when entering the break phase.
  useEffect(() => {
    if (phase === "break") {
      breakTimer.reset(BREAK_SECONDS);
      breakTimer.start();
      setBreakDone(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function startFocus(mins: (typeof SESSION_OPTIONS)[number]) {
    setMinutes(mins);
    focus.reset(mins * 60);
    setPhase("focus");
    // start on next tick so reset applies
    setTimeout(() => focus.start(), 0);
  }

  function completeBreak() {
    if (!breakDone) {
      awardXp("Movement break", XP.posture);
      setBreakDone(true);
    }
    setPhase("idle");
  }
  function skipBreak() {
    setPhase("idle");
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Work Mode</h1>
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

      {phase === "idle" && (
        <>
          <Card className="p-5">
            <p className="mb-3 font-semibold">Choose a focus session</p>
            <div className="grid grid-cols-3 gap-3">
              {SESSION_OPTIONS.map((mins) => (
                <button
                  key={mins}
                  onClick={() => setMinutes(mins)}
                  aria-pressed={minutes === mins}
                  className={cn(
                    "rounded-2xl border-2 p-4 text-center transition-all",
                    minutes === mins
                      ? "border-primary bg-primary-soft/70 shadow-soft"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <p className="text-2xl font-extrabold">{mins}</p>
                  <p className="text-xs text-muted-foreground">minutes</p>
                </button>
              ))}
            </div>
            <Button
              size="lg"
              className="mt-4 w-full"
              onClick={() => startFocus(minutes)}
            >
              <Play className="h-5 w-5" aria-hidden />
              Start {minutes}-minute session
            </Button>
          </Card>

          <Card className="flex items-center gap-3 bg-primary-soft/50 p-4">
            <Timer className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <p className="text-sm text-foreground">
              When your session ends, DeskHero will suggest a two-minute movement
              break — worth {XP.posture} XP.
            </p>
          </Card>
        </>
      )}

      {phase === "focus" && (
        <Card className="flex flex-col items-center gap-5 p-6">
          <ScoreRing value={focus.progress * 100} size={200} strokeWidth={14}>
            <div className="text-center">
              <p className="text-4xl font-extrabold tabular-nums">
                {formatTime(focus.remaining)}
              </p>
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
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                focus.reset(minutes * 60);
                setPhase("idle");
              }}
              aria-label="End session"
            >
              <RotateCcw className="h-5 w-5" aria-hidden />
            </Button>
          </div>

          {/* Demo helper so testers don't wait the full session */}
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
              <h2 className="text-xl font-extrabold">Time for a movement break</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Nice focus session! Pick one and give your body a reset.
              </p>
            </div>
            <ScoreRing value={breakTimer.progress * 100} size={120} strokeWidth={10}>
              <p className="text-2xl font-extrabold tabular-nums">
                {formatTime(breakTimer.remaining)}
              </p>
            </ScoreRing>
            <div className="flex gap-2">
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
            </div>
          </Card>

          <Card className="p-5">
            <p className="mb-3 font-semibold">Break ideas</p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {BREAK_ACTIVITIES.map((a) => (
                <li
                  key={a}
                  className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-sm"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {a}
                </li>
              ))}
            </ul>
          </Card>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="lg" onClick={skipBreak} className="flex-1">
              Skip break
            </Button>
            <Button
              variant="success"
              size="lg"
              onClick={completeBreak}
              className="flex-1"
            >
              <Check className="h-5 w-5" aria-hidden />
              Complete break · +{XP.posture} XP
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
