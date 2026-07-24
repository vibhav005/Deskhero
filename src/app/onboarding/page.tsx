"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LogoMark } from "@/components/app/logo";
import { cn } from "@/lib/utils";
import type {
  ActivityLevel,
  ActivityPreference,
  Goal,
  ReminderPreference,
  SessionDuration,
  UserProfile,
} from "@/lib/types";

type Choice<T> = { value: T; label: string; hint?: string };

const ACTIVITY_LEVELS: Choice<ActivityLevel>[] = [
  { value: "inactive", label: "Mostly inactive", hint: "Little movement in a day" },
  { value: "light", label: "Lightly active", hint: "Occasional walks or stretches" },
  { value: "moderate", label: "Moderately active", hint: "Regular movement already" },
];

const GOALS: Choice<Goal>[] = [
  { value: "energy", label: "Energy" },
  { value: "posture", label: "Posture" },
  { value: "strength", label: "Strength" },
  { value: "flexibility", label: "Flexibility" },
  { value: "sleep", label: "Sleep" },
  { value: "general", label: "General health" },
];

const DURATIONS: Choice<SessionDuration>[] = [
  { value: 5, label: "5 minutes" },
  { value: 10, label: "10 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 20, label: "20 minutes" },
];

const PREFERENCES: Choice<ActivityPreference>[] = [
  { value: "walking", label: "Walking" },
  { value: "stretching", label: "Stretching" },
  { value: "strength", label: "Strength exercises" },
  { value: "breathing", label: "Breathing" },
  { value: "mixed", label: "A balanced mix" },
];

const REMINDERS: Choice<ReminderPreference>[] = [
  { value: "work", label: "During work" },
  { value: "morning", label: "Morning" },
  { value: "evening", label: "Evening" },
  { value: "none", label: "No reminders" },
];

const HOURS: Choice<number>[] = [
  { value: 4, label: "About 4 hours" },
  { value: 6, label: "About 6 hours" },
  { value: 8, label: "About 8 hours" },
  { value: 10, label: "10+ hours" },
];

const TOTAL_STEPS = 8; // 7 questions + safety/summary

export default function OnboardingPage() {
  const router = useRouter();
  const { completeOnboarding } = useStore();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [hours, setHours] = useState<number | null>(null);
  const [activity, setActivity] = useState<ActivityLevel | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [duration, setDuration] = useState<SessionDuration | null>(null);
  const [preference, setPreference] = useState<ActivityPreference | null>(null);
  const [reminder, setReminder] = useState<ReminderPreference | null>(null);

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return name.trim().length > 0;
      case 1:
        return hours !== null;
      case 2:
        return activity !== null;
      case 3:
        return goal !== null;
      case 4:
        return duration !== null;
      case 5:
        return preference !== null;
      case 6:
        return reminder !== null;
      default:
        return true;
    }
  }, [step, name, hours, activity, goal, duration, preference, reminder]);

  function next() {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  }
  function back() {
    if (step === 0) router.push("/");
    else setStep((s) => s - 1);
  }

  function finish() {
    const profile: UserProfile = {
      name: name.trim() || "Friend",
      hoursSitting: hours ?? 8,
      activityLevel: activity ?? "light",
      goal: goal ?? "general",
      sessionDuration: duration ?? 10,
      activityPreference: preference ?? "mixed",
      reminderPreference: reminder ?? "work",
    };
    completeOnboarding(profile);
    router.push("/dashboard");
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-6 py-8"
    >
      <header className="flex items-center gap-3">
        <LogoMark className="h-9 w-9" />
        <div className="flex-1">
          <Progress
            value={progress}
            className="h-2"
            label={`Step ${step + 1} of ${TOTAL_STEPS}`}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {step + 1}/{TOTAL_STEPS}
        </span>
      </header>

      <div className="flex flex-1 flex-col justify-center py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {step === 0 && (
              <StepShell
                title="What should we call you?"
                subtitle="We'll use this to greet you — no account needed."
              >
                <label htmlFor="name" className="sr-only">
                  Your name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canContinue) next();
                  }}
                  placeholder="e.g. Alex"
                  autoFocus
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 text-lg shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </StepShell>
            )}

            {step === 1 && (
              <StepShell
                title="How many hours do you normally sit each day?"
                subtitle="A rough estimate is perfectly fine."
              >
                <OptionGrid>
                  {HOURS.map((c) => (
                    <OptionButton
                      key={c.value}
                      selected={hours === c.value}
                      onClick={() => setHours(c.value)}
                      label={c.label}
                    />
                  ))}
                </OptionGrid>
              </StepShell>
            )}

            {step === 2 && (
              <StepShell
                title="What is your current activity level?"
                subtitle="This helps us keep things achievable."
              >
                <OptionList>
                  {ACTIVITY_LEVELS.map((c) => (
                    <OptionButton
                      key={c.value}
                      selected={activity === c.value}
                      onClick={() => setActivity(c.value)}
                      label={c.label}
                      hint={c.hint}
                    />
                  ))}
                </OptionList>
              </StepShell>
            )}

            {step === 3 && (
              <StepShell
                title="What would you most like to improve?"
                subtitle="Pick the one that matters most right now."
              >
                <OptionGrid>
                  {GOALS.map((c) => (
                    <OptionButton
                      key={c.value}
                      selected={goal === c.value}
                      onClick={() => setGoal(c.value)}
                      label={c.label}
                    />
                  ))}
                </OptionGrid>
              </StepShell>
            )}

            {step === 4 && (
              <StepShell
                title="How much time can you realistically spend?"
                subtitle="We'll never assign anything longer than this."
              >
                <OptionGrid>
                  {DURATIONS.map((c) => (
                    <OptionButton
                      key={c.value}
                      selected={duration === c.value}
                      onClick={() => setDuration(c.value)}
                      label={c.label}
                    />
                  ))}
                </OptionGrid>
              </StepShell>
            )}

            {step === 5 && (
              <StepShell
                title="Which activities do you prefer?"
                subtitle="We'll lean toward what you enjoy."
              >
                <OptionList>
                  {PREFERENCES.map((c) => (
                    <OptionButton
                      key={c.value}
                      selected={preference === c.value}
                      onClick={() => setPreference(c.value)}
                      label={c.label}
                    />
                  ))}
                </OptionList>
              </StepShell>
            )}

            {step === 6 && (
              <StepShell
                title="When would you like movement reminders?"
                subtitle="You can change this anytime in settings."
              >
                <OptionGrid>
                  {REMINDERS.map((c) => (
                    <OptionButton
                      key={c.value}
                      selected={reminder === c.value}
                      onClick={() => setReminder(c.value)}
                      label={c.label}
                    />
                  ))}
                </OptionGrid>
              </StepShell>
            )}

            {step === 7 && (
              <StepShell
                title="You're all set!"
                subtitle="Here's a quick safety note before we build your plan."
              >
                <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-soft p-4">
                  <ShieldAlert
                    className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--warning))]"
                    aria-hidden
                  />
                  <p className="text-sm leading-relaxed text-foreground">
                    DeskHero provides general wellness guidance and is not medical
                    advice. Stop exercising if you experience pain, dizziness, chest
                    discomfort, or unusual shortness of breath.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary-soft/60 p-4">
                  <Sparkles className="h-5 w-5 text-primary" aria-hidden />
                  <p className="text-sm text-foreground">
                    We&apos;ll create a personalised demo plan of short,
                    achievable quests based on your answers.
                  </p>
                </div>
              </StepShell>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="flex items-center gap-3">
        <Button variant="ghost" size="lg" onClick={back} className="px-4">
          <ArrowLeft className="h-5 w-5" aria-hidden />
          <span className="sr-only sm:not-sr-only">Back</span>
        </Button>
        {step < TOTAL_STEPS - 1 ? (
          <Button
            size="lg"
            onClick={next}
            disabled={!canContinue}
            className="flex-1"
          >
            Continue
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Button>
        ) : (
          <Button size="lg" onClick={finish} className="flex-1">
            Build my plan
            <Check className="h-5 w-5" aria-hidden />
          </Button>
        )}
      </footer>
    </main>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function OptionGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
function OptionList({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3">{children}</div>;
}

function OptionButton({
  selected,
  onClick,
  label,
  hint,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3.5 text-left transition-all",
        selected
          ? "border-primary bg-primary-soft/70 shadow-soft"
          : "border-border bg-surface hover:border-primary/40",
      )}
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {hint}
          </span>
        )}
      </span>
      <span
        className={cn(
          "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
        aria-hidden
      >
        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
    </button>
  );
}
