"use client";

import { useMemo, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ShieldAlert, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LogoMark } from "@/components/app/logo";
import { cn } from "@/lib/utils";
import { saveOnboardingStep, completeOnboarding, type StepResult } from "@/lib/actions/onboarding";
import type { OnboardingProgress } from "@/lib/queries/onboarding";
import type {
  ActivityLevel,
  ActivityPreference,
  Goal,
  ReminderPreference,
  SessionDuration,
  UserProfile,
} from "@/lib/types";

type Choice<T> = { value: T; label: string; hint?: string };

const AGE_RANGES: Choice<string>[] = [
  { value: "18-24", label: "18-24" },
  { value: "25-34", label: "25-34" },
  { value: "35-44", label: "35-44" },
  { value: "45-54", label: "45-54" },
  { value: "55-64", label: "55-64" },
  { value: "65+", label: "65+" },
];

const HOURS: Choice<number>[] = [
  { value: 4, label: "About 4 hours" },
  { value: 6, label: "About 6 hours" },
  { value: 8, label: "About 8 hours" },
  { value: 10, label: "10+ hours" },
];

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

const WORK_SCHEDULES: Choice<string>[] = [
  { value: "standard", label: "Standard 9-5" },
  { value: "early", label: "Early shift" },
  { value: "late", label: "Late shift" },
  { value: "flexible", label: "Flexible / varies" },
];

const REMINDERS: Choice<ReminderPreference>[] = [
  { value: "work", label: "During work" },
  { value: "morning", label: "Morning" },
  { value: "evening", label: "Evening" },
  { value: "none", label: "No reminders" },
];

const LIMITATIONS: Choice<string>[] = [
  { value: "prefer_seated", label: "Prefer seated activities" },
  { value: "avoid_jumping", label: "Avoid jumping" },
  { value: "avoid_floor_exercises", label: "Avoid floor exercises" },
  { value: "prefer_low_impact", label: "Prefer low-impact activities" },
];

const TOTAL_STEPS = 11;

const initialCompleteState: StepResult = { ok: true };

/** First step whose field is still unanswered, so a resumed session jumps straight there. */
function resumeStepFor(initial: OnboardingProgress): number {
  if (!initial.displayName || !initial.ageRange) return 0;
  if (initial.hoursSitting === null) return 1;
  if (!initial.activityLevel) return 2;
  if (!initial.goal) return 3;
  if (initial.sessionDuration === null) return 4;
  if (!initial.activityPreference) return 5;
  if (!initial.workSchedule?.type) return 6;
  if (!initial.reminderPreference) return 7;
  // Steps 8 (accessibility) and 9 (limitations) are optional — never block resume on them.
  return 10;
}

export function OnboardingWizard({ initial }: { initial: OnboardingProgress }) {
  const router = useRouter();
  const { completeOnboarding: bridgeLegacyStore } = useStore();
  const [, startSaving] = useTransition();

  const [step, setStep] = useState(() => resumeStepFor(initial));
  const [name, setName] = useState(initial.displayName ?? "");
  const [ageRange, setAgeRange] = useState<string | null>(initial.ageRange);
  const [hours, setHours] = useState<number | null>(initial.hoursSitting);
  const [activity, setActivity] = useState<ActivityLevel | null>(
    (initial.activityLevel as ActivityLevel) ?? null,
  );
  const [goal, setGoal] = useState<Goal | null>((initial.goal as Goal) ?? null);
  const [duration, setDuration] = useState<SessionDuration | null>(
    (initial.sessionDuration as SessionDuration) ?? null,
  );
  const [preference, setPreference] = useState<ActivityPreference | null>(
    (initial.activityPreference as ActivityPreference) ?? null,
  );
  const [workSchedule, setWorkSchedule] = useState<string | null>(initial.workSchedule?.type ?? null);
  const [reminder, setReminder] = useState<ReminderPreference | null>(
    (initial.reminderPreference as ReminderPreference) ?? null,
  );
  const [reducedMotion, setReducedMotion] = useState(initial.accessibilityPrefs?.reducedMotion ?? false);
  const [largeText, setLargeText] = useState(initial.accessibilityPrefs?.largeText ?? false);
  const [limitations, setLimitations] = useState<string[]>(initial.limitationTags ?? []);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [completeState, completeAction] = useFormState(async (
    _prev: StepResult,
    formData: FormData,
  ) => {
    const result = await completeOnboarding(_prev, formData);
    if (result.ok) {
      const profile: UserProfile = {
        name: name.trim() || "Friend",
        hoursSitting: hours ?? 8,
        activityLevel: activity ?? "light",
        goal: goal ?? "general",
        sessionDuration: duration ?? 10,
        activityPreference: preference ?? "mixed",
        reminderPreference: reminder ?? "work",
      };
      // Temporary bridge: keeps not-yet-migrated pages (dashboard/quests/etc.)
      // working on the legacy local store until M2/M3 move them onto real
      // queries. Safe to remove once every page reads from Supabase.
      bridgeLegacyStore(profile);
      router.push("/dashboard");
    }
    return result;
  }, initialCompleteState);

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return name.trim().length > 0 && ageRange !== null;
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
        return workSchedule !== null;
      case 7:
        return reminder !== null;
      case 8:
        return true; // accessibility prefs are optional
      case 9:
        return true; // limitations are optional (empty = none stated)
      default:
        return true;
    }
  }, [step, name, ageRange, hours, activity, goal, duration, preference, workSchedule, reminder]);

  function persistStep(payload: Parameters<typeof saveOnboardingStep>[0]) {
    setSaveError(null);
    startSaving(async () => {
      const result = await saveOnboardingStep(payload);
      if (!result.ok) setSaveError(result.message ?? "Could not save — check your connection.");
    });
  }

  function next() {
    switch (step) {
      case 0:
        persistStep({ displayName: name.trim(), ageRange: ageRange as never });
        break;
      case 1:
        persistStep({ hoursSitting: hours! });
        break;
      case 2:
        persistStep({ activityLevel: activity! });
        break;
      case 3:
        persistStep({ goal: goal! });
        break;
      case 4:
        persistStep({ sessionDuration: duration! });
        break;
      case 5:
        persistStep({ activityPreference: preference! });
        break;
      case 6:
        persistStep({ workSchedule: { type: workSchedule as never } });
        break;
      case 7:
        persistStep({ reminderPreference: reminder! });
        break;
      case 8:
        persistStep({ accessibilityPrefs: { reducedMotion, largeText } });
        break;
      case 9:
        persistStep({ limitationTags: limitations as never });
        break;
      default:
        break;
    }
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  }

  function back() {
    if (step === 0) router.push("/");
    else setStep((s) => s - 1);
  }

  function toggleLimitation(value: string) {
    setLimitations((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <main id="main" className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-6 py-8">
      <header className="flex items-center gap-3">
        <LogoMark className="h-9 w-9" />
        <div className="flex-1">
          <Progress value={progress} className="h-2" label={`Step ${step + 1} of ${TOTAL_STEPS}`} />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {step + 1}/{TOTAL_STEPS}
        </span>
      </header>

      {saveError && (
        <p role="alert" className="mt-3 rounded-xl bg-warning-soft px-3 py-2 text-xs text-[hsl(var(--warning))]">
          {saveError}
        </p>
      )}

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
              <StepShell title="Let's set up your profile" subtitle="Just the basics — no exact birthdate needed.">
                <label htmlFor="name" className="sr-only">Your name</label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  autoFocus
                  className="w-full rounded-2xl border border-border bg-surface px-4 py-3.5 text-lg shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="mb-2 mt-5 text-sm font-semibold">Age range</p>
                <OptionGrid>
                  {AGE_RANGES.map((c) => (
                    <OptionButton key={c.value} selected={ageRange === c.value} onClick={() => setAgeRange(c.value)} label={c.label} />
                  ))}
                </OptionGrid>
              </StepShell>
            )}

            {step === 1 && (
              <StepShell title="How many hours do you normally sit each day?" subtitle="A rough estimate is perfectly fine.">
                <OptionGrid>
                  {HOURS.map((c) => (
                    <OptionButton key={c.value} selected={hours === c.value} onClick={() => setHours(c.value)} label={c.label} />
                  ))}
                </OptionGrid>
              </StepShell>
            )}

            {step === 2 && (
              <StepShell title="What is your current activity level?" subtitle="This helps us keep things achievable.">
                <OptionList>
                  {ACTIVITY_LEVELS.map((c) => (
                    <OptionButton key={c.value} selected={activity === c.value} onClick={() => setActivity(c.value)} label={c.label} hint={c.hint} />
                  ))}
                </OptionList>
              </StepShell>
            )}

            {step === 3 && (
              <StepShell title="What would you most like to improve?" subtitle="Pick the one that matters most right now.">
                <OptionGrid>
                  {GOALS.map((c) => (
                    <OptionButton key={c.value} selected={goal === c.value} onClick={() => setGoal(c.value)} label={c.label} />
                  ))}
                </OptionGrid>
              </StepShell>
            )}

            {step === 4 && (
              <StepShell title="How much time can you realistically spend?" subtitle="We'll never assign anything longer than this.">
                <OptionGrid>
                  {DURATIONS.map((c) => (
                    <OptionButton key={c.value} selected={duration === c.value} onClick={() => setDuration(c.value)} label={c.label} />
                  ))}
                </OptionGrid>
              </StepShell>
            )}

            {step === 5 && (
              <StepShell title="Which activities do you prefer?" subtitle="We'll lean toward what you enjoy.">
                <OptionList>
                  {PREFERENCES.map((c) => (
                    <OptionButton key={c.value} selected={preference === c.value} onClick={() => setPreference(c.value)} label={c.label} />
                  ))}
                </OptionList>
              </StepShell>
            )}

            {step === 6 && (
              <StepShell title="What does your work schedule look like?" subtitle="Helps us time nudges sensibly.">
                <OptionGrid>
                  {WORK_SCHEDULES.map((c) => (
                    <OptionButton key={c.value} selected={workSchedule === c.value} onClick={() => setWorkSchedule(c.value)} label={c.label} />
                  ))}
                </OptionGrid>
              </StepShell>
            )}

            {step === 7 && (
              <StepShell title="When would you like movement reminders?" subtitle="You can change this anytime in settings.">
                <OptionGrid>
                  {REMINDERS.map((c) => (
                    <OptionButton key={c.value} selected={reminder === c.value} onClick={() => setReminder(c.value)} label={c.label} />
                  ))}
                </OptionGrid>
              </StepShell>
            )}

            {step === 8 && (
              <StepShell title="Any accessibility preferences?" subtitle="Optional — you can change these later too.">
                <OptionList>
                  <OptionButton selected={reducedMotion} onClick={() => setReducedMotion((v) => !v)} label="Reduce motion" hint="Minimise animations across the app" />
                  <OptionButton selected={largeText} onClick={() => setLargeText((v) => !v)} label="Larger text" hint="Increase base text size" />
                </OptionList>
              </StepShell>
            )}

            {step === 9 && (
              <StepShell title="Any exercise limitations we should know?" subtitle="Optional — select any that apply, or none at all.">
                <OptionList>
                  {LIMITATIONS.map((c) => (
                    <OptionButton key={c.value} selected={limitations.includes(c.value)} onClick={() => toggleLimitation(c.value)} label={c.label} />
                  ))}
                </OptionList>
              </StepShell>
            )}

            {step === 10 && (
              <StepShell title="You're all set!" subtitle="One last safety note before we build your plan.">
                <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-soft p-4">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--warning))]" aria-hidden />
                  <p className="text-sm leading-relaxed text-foreground">
                    DeskHero provides general wellness guidance and is not medical advice or a
                    healthcare service. Stop exercising if you experience pain, dizziness, chest
                    discomfort, or unusual shortness of breath, and seek medical attention if
                    needed.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary-soft/60 p-4">
                  <Sparkles className="h-5 w-5 text-primary" aria-hidden />
                  <p className="text-sm text-foreground">
                    We&apos;ll build your first personalised plan of short, achievable quests
                    based on your answers.
                  </p>
                </div>

                <form action={completeAction} className="mt-4 flex flex-col gap-3">
                  <label className="flex items-start gap-2.5 text-sm">
                    <input type="checkbox" name="consentTos" required className="mt-0.5 h-4 w-4" />
                    I agree to the Terms of Service.
                  </label>
                  <label className="flex items-start gap-2.5 text-sm">
                    <input type="checkbox" name="consentPrivacy" required className="mt-0.5 h-4 w-4" />
                    I agree to the Privacy Policy and consent to my account and progress data
                    being stored.
                  </label>
                  {!completeState.ok && completeState.message && (
                    <p role="alert" className="text-xs text-[hsl(var(--warning))]">
                      {completeState.message}
                    </p>
                  )}
                  <Button type="submit" size="lg" className="mt-1 w-full">
                    Build my plan
                    <Check className="h-5 w-5" aria-hidden />
                  </Button>
                </form>
              </StepShell>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {step < TOTAL_STEPS - 1 && (
        <footer className="flex items-center gap-3">
          <Button variant="ghost" size="lg" onClick={back} className="px-4">
            <ArrowLeft className="h-5 w-5" aria-hidden />
            <span className="sr-only sm:not-sr-only">Back</span>
          </Button>
          <Button size="lg" onClick={next} disabled={!canContinue} className="flex-1">
            Continue
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Button>
        </footer>
      )}
      {step === TOTAL_STEPS - 1 && (
        <footer className="flex items-center gap-3">
          <Button variant="ghost" size="lg" onClick={back} className="px-4">
            <ArrowLeft className="h-5 w-5" aria-hidden />
            <span className="sr-only sm:not-sr-only">Back</span>
          </Button>
        </footer>
      )}
    </main>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
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

function OptionButton({ selected, onClick, label, hint }: { selected: boolean; onClick: () => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3.5 text-left transition-all",
        selected ? "border-primary bg-primary-soft/70 shadow-soft" : "border-border bg-surface hover:border-primary/40",
      )}
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
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
