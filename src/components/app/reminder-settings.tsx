"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, Clock } from "lucide-react";
import {
  getMyReminderPreferences,
  snoozeReminders,
  toggleMute,
  updateReminderPreferences,
  type ReminderPreferencesRow,
} from "@/lib/actions/reminders";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const SNOOZE_OPTIONS = [
  { hours: 1 as const, label: "1 hour" },
  { hours: 3 as const, label: "3 hours" },
  { hours: 24 as const, label: "Tomorrow" },
];

const MAX_PER_DAY_OPTIONS = [1, 3, 5, 8, 10];

export function ReminderSettings() {
  const [prefs, setPrefs] = useState<ReminderPreferencesRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    "unsupported",
  );

  useEffect(() => {
    getMyReminderPreferences().then((data) => {
      setPrefs(data);
      setLoading(false);
    });
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  function refresh() {
    startTransition(async () => {
      const data = await getMyReminderPreferences();
      setPrefs(data);
    });
  }

  function handleMuteToggle(muted: boolean) {
    setPrefs((p) => (p ? { ...p, muted } : p));
    startTransition(async () => {
      await toggleMute({ muted });
      refresh();
    });
  }

  function handleSnooze(hours: 1 | 3 | 24) {
    startTransition(async () => {
      await snoozeReminders({ hours });
      refresh();
    });
  }

  function handleQuietHours(field: "quietHoursStart" | "quietHoursEnd", value: string) {
    startTransition(async () => {
      await updateReminderPreferences({ [field]: value || null });
      refresh();
    });
  }

  function handleMaxPerDay(value: number) {
    startTransition(async () => {
      await updateReminderPreferences({ maxPerDay: value });
      refresh();
    });
  }

  async function requestNotificationPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  }

  if (loading) {
    return (
      <Card className="p-5">
        <p className="text-sm text-muted-foreground">Loading reminder settings…</p>
      </Card>
    );
  }

  const snoozedUntil = prefs?.snooze_until && new Date(prefs.snooze_until) > new Date()
    ? new Date(prefs.snooze_until)
    : null;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-2">
        {prefs?.muted ? (
          <BellOff className="h-5 w-5 text-muted-foreground" aria-hidden />
        ) : (
          <Bell className="h-5 w-5 text-primary" aria-hidden />
        )}
        <h2 className="font-semibold">Reminders</h2>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Mute all reminders</p>
          <p className="text-xs text-muted-foreground">Pause in-app nudges until you turn this back on.</p>
        </div>
        <Switch
          checked={prefs?.muted ?? false}
          onCheckedChange={handleMuteToggle}
          label="Mute all reminders"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Snooze</p>
        <div className="flex flex-wrap gap-2">
          {SNOOZE_OPTIONS.map((o) => (
            <button
              key={o.hours}
              type="button"
              onClick={() => handleSnooze(o.hours)}
              disabled={pending}
              className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {o.label}
            </button>
          ))}
        </div>
        {snoozedUntil && (
          <p className="mt-2 text-xs text-muted-foreground">
            Snoozed until {snoozedUntil.toLocaleString(undefined, { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })}
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
          <Clock className="h-4 w-4" aria-hidden />
          Quiet hours
        </p>
        <div className="flex items-center gap-2 text-sm">
          <input
            type="time"
            defaultValue={prefs?.quiet_hours_start?.slice(0, 5) ?? ""}
            onBlur={(e) => handleQuietHours("quietHoursStart", e.target.value)}
            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Quiet hours start"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="time"
            defaultValue={prefs?.quiet_hours_end?.slice(0, 5) ?? ""}
            onBlur={(e) => handleQuietHours("quietHoursEnd", e.target.value)}
            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Quiet hours end"
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">No reminders will be sent in this window.</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Maximum reminders per day</p>
        <div className="flex flex-wrap gap-2">
          {MAX_PER_DAY_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleMaxPerDay(n)}
              disabled={pending}
              aria-pressed={prefs?.max_per_day === n}
              className={cn(
                "h-9 w-9 rounded-full border text-sm font-medium transition-colors",
                prefs?.max_per_day === n
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="mb-2 text-sm font-medium">Browser notifications</p>
        {notifPermission === "unsupported" && (
          <p className="text-xs text-muted-foreground">Not supported in this browser.</p>
        )}
        {notifPermission === "granted" && (
          <p className="text-xs text-success">Enabled — you&apos;ll see reminders even if the tab isn&apos;t focused.</p>
        )}
        {notifPermission === "denied" && (
          <p className="text-xs text-muted-foreground">
            Blocked in your browser settings. In-app reminders will still show while DeskHero is open.
          </p>
        )}
        {notifPermission === "default" && (
          <Button variant="outline" size="sm" onClick={requestNotificationPermission}>
            Enable browser notifications
          </Button>
        )}
      </div>
    </Card>
  );
}
