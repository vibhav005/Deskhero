"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PartyPopper } from "lucide-react";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

const SUPPORTIVE_LINES = [
  "Every movement counts.",
  "A small step is still progress.",
  "Let's build on today.",
  "Nicely done — your body thanks you.",
  "That's a win worth celebrating.",
];

function lineForId(id: number) {
  return SUPPORTIVE_LINES[id % SUPPORTIVE_LINES.length];
}

/** A calm, encouraging confirmation toast. Auto-dismisses. */
export function Celebration() {
  const { celebration, clearCelebration, state } = useStore();
  const reduced = state.settings.reducedMotion;

  useEffect(() => {
    if (!celebration) return;
    const t = setTimeout(clearCelebration, 2600);
    return () => clearTimeout(t);
  }, [celebration, clearCelebration]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {celebration && (
          <motion.div
            key={celebration.id}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.96 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: reduced ? 0.15 : 0.35, ease: "easeOut" }}
            className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-lift"
            role="status"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-success-soft text-success">
              <PartyPopper className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                +{celebration.xp} XP · {celebration.message}
              </p>
              <p className="text-xs text-muted-foreground">
                {lineForId(celebration.id)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
