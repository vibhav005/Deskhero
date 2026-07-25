"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { checkDueReminder } from "@/lib/actions/reminders";
import { useStore } from "@/lib/store";

// There's no background push yet, so this only fires while the app is open in a tab.
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Periodically asks the server whether a reminder is due (quiet
 * hours/snooze/mute/daily-cap all enforced server-side) and shows an in-app
 * toast, plus a browser Notification if permission was already granted.
 * Never prompts for permission itself — that's an explicit opt-in from
 * Profile settings, since browsers rightly gate that behind a user gesture.
 */
export function ReminderHeartbeat() {
  const { state } = useStore();
  const reduced = state.settings.reducedMotion;
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const result = await checkDueReminder();
      if (cancelled || !result.shouldFire || !result.message) return;

      setToast(result.message);

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("DeskHero", { body: result.message });
        } catch {
          // Some platforms only support Notification via a service worker —
          // the in-app toast above already covers the message either way.
        }
      }
    }

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[55] flex justify-center px-4"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.96 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: reduced ? 0.15 : 0.35, ease: "easeOut" }}
            className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-lift"
            role="status"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
              <Sparkles className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-sm font-medium text-foreground">{toast}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
