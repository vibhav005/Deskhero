"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseTimerOptions {
  /** Total seconds to count down from. */
  seconds: number;
  onComplete?: () => void;
}

export interface TimerControls {
  remaining: number;
  running: boolean;
  finished: boolean;
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: (newSeconds?: number) => void;
  /** 0–1 fraction elapsed. */
  progress: number;
}

/** A pause/resume countdown timer driven by an interval. */
export function useTimer({ seconds, onComplete }: UseTimerOptions): TimerControls {
  const [total, setTotal] = useState(seconds);
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          setRunning(false);
          onCompleteRef.current?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const start = useCallback(() => {
    if (remaining > 0) setRunning(true);
  }, [remaining]);
  const pause = useCallback(() => setRunning(false), []);
  const toggle = useCallback(() => {
    setRunning((r) => (remaining > 0 ? !r : false));
  }, [remaining]);
  const reset = useCallback(
    (newSeconds?: number) => {
      const value = newSeconds ?? total;
      setTotal(value);
      setRemaining(value);
      setRunning(false);
    },
    [total],
  );

  const progress = total > 0 ? (total - remaining) / total : 0;
  return {
    remaining,
    running,
    finished: remaining === 0,
    start,
    pause,
    toggle,
    reset,
    progress,
  };
}
