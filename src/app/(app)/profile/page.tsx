"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  HeartPulse,
  Lock,
  LogOut,
  RefreshCw,
  Shield,
  Snowflake,
  Volume2,
  Sparkles,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { useStore } from "@/lib/store";
import { levelForXp } from "@/lib/logic";
import { nextGearUnlock } from "@/lib/pixel-hero";
import { LEVELS } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PixelHero } from "@/components/app/pixel-hero";
import { ReminderSettings } from "@/components/app/reminder-settings";
import { AnalyticsConsentToggle } from "@/components/app/analytics-consent-toggle";
import { cn } from "@/lib/utils";
import type {
  Goal,
  ReminderPreference,
  SessionDuration,
} from "@/lib/types";

const GOALS: { value: Goal; label: string }[] = [
  { value: "energy", label: "Energy" },
  { value: "posture", label: "Posture" },
  { value: "strength", label: "Strength" },
  { value: "flexibility", label: "Flexibility" },
  { value: "sleep", label: "Sleep" },
  { value: "general", label: "General health" },
];

const DURATIONS: SessionDuration[] = [5, 10, 15, 20];

const REMINDERS: { value: ReminderPreference; label: string }[] = [
  { value: "work", label: "During work" },
  { value: "morning", label: "Morning" },
  { value: "evening", label: "Evening" },
  { value: "none", label: "None" },
];

export default function ProfilePage() {
  const router = useRouter();
  const {
    state,
    updateProfile,
    updateSettings,
    resetDemo,
    useStreakFreeze,
    regenerateToday,
    setXp,
  } = useStore();
  const profile = state.profile!;
  const level = levelForXp(state.xp);
  const nextGear = nextGearUnlock(level.level);
  const [confirmReset, setConfirmReset] = useState(false);

  function handleReset() {
    resetDemo();
    router.push("/");
  }

  function changeGoal(goal: Goal) {
    updateProfile({ goal });
    regenerateToday();
  }
  function changeDuration(sessionDuration: SessionDuration) {
    updateProfile({ sessionDuration });
    regenerateToday();
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <PixelHero level={level.level} size={80} />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {profile.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Level {level.level} · {level.name}
          </p>
          {nextGear && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Next unlock: {nextGear.name} at Level {nextGear.minLevel}
            </p>
          )}
        </div>
      </header>

      {/* Dev-only: jump between levels to preview hero gear without playing through XP. */}
      {process.env.NODE_ENV !== "production" && (
        <Card className="border-dashed p-5">
          <p className="mb-1 text-sm font-semibold">Dev: preview a level</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Jumps your XP straight to that level&apos;s threshold. Dev builds only —
            won&apos;t appear in production.
          </p>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.level}
                type="button"
                onClick={() => setXp(l.minXp)}
                aria-pressed={level.level === l.level}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  level.level === l.level
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground",
                )}
              >
                L{l.level} · {l.name}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Name */}
      <Card className="p-5">
        <label htmlFor="name" className="mb-2 block text-sm font-semibold">
          What should we call you?
        </label>
        <input
          id="name"
          value={profile.name}
          onChange={(e) => updateProfile({ name: e.target.value })}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </Card>

      {/* Primary goal */}
      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold">Primary goal</p>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <Chip
              key={g.value}
              active={profile.goal === g.value}
              onClick={() => changeGoal(g.value)}
            >
              {g.label}
            </Chip>
          ))}
        </div>
      </Card>

      {/* Session duration */}
      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold">Preferred session duration</p>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((d) => (
            <Chip
              key={d}
              active={profile.sessionDuration === d}
              onClick={() => changeDuration(d)}
            >
              {d} min
            </Chip>
          ))}
        </div>
      </Card>

      {/* Reminder preference */}
      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold">Reminder preference</p>
        <div className="flex flex-wrap gap-2">
          {REMINDERS.map((r) => (
            <Chip
              key={r.value}
              active={profile.reminderPreference === r.value}
              onClick={() => updateProfile({ reminderPreference: r.value })}
            >
              {r.label}
            </Chip>
          ))}
        </div>
      </Card>

      {/* Streak freeze */}
      <Card className="flex items-center gap-3 p-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <Snowflake className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex-1">
          <p className="font-semibold">Weekly streak freeze</p>
          <p className="text-sm text-muted-foreground">
            {state.streakFreezeAvailable
              ? "Protect your streak on a busy day — one available this week."
              : "Used this week. It refreshes next week."}
          </p>
        </div>
        <Button
          variant={state.streakFreezeAvailable ? "subtle" : "secondary"}
          size="sm"
          onClick={useStreakFreeze}
          disabled={!state.streakFreezeAvailable}
        >
          {state.streakFreezeAvailable ? "Use" : "Used"}
        </Button>
      </Card>

      {/* Appearance */}
      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold">Appearance</p>
        <div className="flex gap-2">
          <Chip
            active={state.settings.theme === "dark"}
            onClick={() => updateSettings({ theme: "dark" })}
          >
            Dark
          </Chip>
          <Chip
            active={state.settings.theme === "light"}
            onClick={() => updateSettings({ theme: "light" })}
          >
            Light
          </Chip>
        </div>
      </Card>

      {/* Settings toggles */}
      <Card className="divide-y divide-border p-0">
        <SettingRow
          icon={Volume2}
          title="Sound effects"
          description="Play a soft sound on completions."
        >
          <Switch
            checked={state.settings.sound}
            onCheckedChange={(v) => updateSettings({ sound: v })}
            label="Toggle sound effects"
          />
        </SettingRow>
        <SettingRow
          icon={Sparkles}
          title="Reduced motion"
          description="Minimise animations across the app."
        >
          <Switch
            checked={state.settings.reducedMotion}
            onCheckedChange={(v) => updateSettings({ reducedMotion: v })}
            label="Toggle reduced motion"
          />
        </SettingRow>
        <AnalyticsConsentToggle />
      </Card>

      {/* Reminders */}
      <ReminderSettings />

      {/* Health & safety */}
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="font-semibold">Health &amp; safety</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          DeskHero provides general wellness guidance and is not medical advice.
          Stop exercising if you experience pain, dizziness, chest discomfort, or
          unusual shortness of breath. If you have a health condition, check with
          a professional before starting new activity.
        </p>
      </Card>

      {/* Privacy */}
      <Card className="flex items-start gap-3 bg-muted/40 p-5">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        <div>
          <p className="font-semibold">Privacy</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account and progress are stored securely and only used to run
            DeskHero. We never sell your data or show you ads.
          </p>
        </div>
      </Card>

      {/* Account */}
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <LogOut className="h-5 w-5 text-muted-foreground" aria-hidden />
          <h2 className="font-semibold">Account</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in. Signing out ends your session on this device.
        </p>
        <form action={signOut}>
          <Button type="submit" variant="outline" className="mt-4 w-full">
            Sign out
          </Button>
        </form>
      </Card>

      {/* Reset */}
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-[hsl(var(--warning))]" aria-hidden />
          <h2 className="font-semibold">Reset demo data</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Clear all saved progress and return to the welcome screen. This can&apos;t
          be undone.
        </p>
        {!confirmReset ? (
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => setConfirmReset(true)}
          >
            Reset demo data
          </Button>
        ) : (
          <div className="mt-4 flex gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setConfirmReset(false)}
            >
              Cancel
            </Button>
            <Button variant="accent" className="flex-1" onClick={handleReset}>
              Yes, reset
            </Button>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-center gap-2 pb-2 text-xs text-muted-foreground">
        <Shield className="h-4 w-4" aria-hidden />
        DeskHero prototype · Phase 1
      </div>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Volume2;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
