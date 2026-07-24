"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  className?: string;
}

/** A number that gently counts up to its value the first time it scrolls into view. */
export function AnimatedCounter({ value, suffix = "", className }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { state } = useStore();
  const reduced = state.settings.reducedMotion;

  const motionValue = useMotionValue(reduced ? value : 0);
  const springValue = useSpring(motionValue, { damping: 26, stiffness: 130 });
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  useEffect(() => {
    if (reduced) {
      motionValue.set(value);
    } else if (inView) {
      motionValue.set(value);
    }
  }, [inView, value, reduced, motionValue]);

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = `${Math.round(springValue.get())}${suffix}`;
    }
    return springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${Math.round(latest)}${suffix}`;
      }
    });
  }, [springValue, suffix]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {reduced ? `${value}${suffix}` : `0${suffix}`}
    </span>
  );
}
