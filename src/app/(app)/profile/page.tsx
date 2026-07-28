"use client";

import {
  HeartPulse,
  Lock,
  LogOut,
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
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Callout } from "@/components/ui/callout";
import { PixelHero } from "@/components/app/pixel-hero";
import { ReminderSettings } from "@/components/app/reminder-settings";
import { AnalyticsConsentToggle } from "@/components/app/analytics-consent-toggle";
import { FeedbackForm } from "@/components/app/feedback-form";
import { DataPrivacyPanel } from "@/components/app/data-privacy-panel";
import { DeleteAccountPanel } from "@/components/app/delete-account-panel";
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
  const {
    state,
    updateProfile,
    updateSettings,
    useStreakFreeze,
    regenerateToday,
    setXp,
  } = useStore();
  const profile = state.profile!;
  const level = levelForXp(state.xp);
  const nextGear = nextGearUnlock(level.level);

  function changeGoal(goal: Goal) {
    updateProfile({ goal });
    regenerateToday();
  }
  function changeDuration(sessionDuration: SessionDuration) {
    updateProfile({ sessionDuration });
    regenerateToday();
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <PixelHero level={level.level} size={80} />
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
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
              <Chip
                key={l.level}
                active={level.level === l.level}
                onClick={() => setXp(l.minXp)}
              >
                L{l.level} · {l.name}
              </Chip>
            ))}
          </div>
        </Card>
      )}

      <Section label="Profile">
        <Card className="p-5">
          <label htmlFor="name" className="mb-2 block text-sm font-semibold">
            What should we call you?
          </label>
          <Input
            id="name"
            value={profile.name}
            onChange={(e) => updateProfile({ name: e.target.value })}
          />
        </Card>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        </div>
      </Section>

      <Section label="Notifications">
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

        <ReminderSettings />
      </Section>

      <Section label="Appearance & sound">
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
      </Section>

      <Section label="Privacy & data">
        <Callout icon={HeartPulse} tone="neutral" title="Health & safety">
          DeskHero provides general wellness guidance and is not medical advice.
          Stop exercising if you experience pain, dizziness, chest discomfort, or
          unusual shortness of breath. If you have a health condition, check with
          a professional before starting new activity.
        </Callout>

        <Callout icon={Lock} tone="neutral" title="Privacy">
          Your account and progress are stored securely and only used to run
          DeskHero. We never sell your data or show you ads.
        </Callout>

        <DataPrivacyPanel />
      </Section>

      <Section label="Danger zone" tone="warning">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-muted-foreground" aria-hidden />
            <h3 className="font-semibold">Account</h3>
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

        <DeleteAccountPanel />
      </Section>

      <Section label="Feedback">
        <FeedbackForm />
      </Section>

      <div className="flex items-center justify-center gap-2 pb-2 text-xs text-muted-foreground">
        <Shield className="h-4 w-4" aria-hidden />
        DeskHero
      </div>
    </div>
  );
}

function Section({
  label,
  tone = "default",
  children,
}: {
  label: string;
  tone?: "default" | "warning";
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3",
        tone === "warning" && "border-t border-dashed border-border pt-6",
      )}
    >
      <h2
        className={cn(
          "text-xs font-semibold uppercase tracking-wide",
          tone === "warning" ? "text-[hsl(var(--warning))]" : "text-muted-foreground",
        )}
      >
        {label}
      </h2>
      {children}
    </section>
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
