"use client";

import { useState, useTransition } from "react";
import { Check, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { submitCheckIn } from "@/lib/actions/check-ins";

const ENERGY_LEVELS: { value: number; label: string }[] = [
  { value: 1, label: "Very low" },
  { value: 2, label: "Low" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Good" },
  { value: 5, label: "Great" },
];

/** Optional daily readiness check-in — energy level only in this pass, feeds forceEasyOnly in plan generation. */
export function CheckInCard({ initialEnergyLevel }: { initialEnergyLevel: number | null }) {
  const [energyLevel, setEnergyLevel] = useState<number | null>(initialEnergyLevel);
  const [submitted, setSubmitted] = useState(initialEnergyLevel !== null);
  const [pending, startTransition] = useTransition();

  function handlePick(level: number) {
    setEnergyLevel(level);
    startTransition(async () => {
      const result = await submitCheckIn({ energyLevel: level });
      if (result.ok) setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <Card className="flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-success-soft text-success">
          <Check className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold">Thanks for checking in</p>
          <p className="text-xs text-muted-foreground">
            {energyLevel !== null && energyLevel <= 2
              ? "Today can be a lighter day — rest and recovery count too."
              : "Your plan is tuned to how you're feeling today."}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden />
        <p className="text-sm font-semibold">How&apos;s your energy today?</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {ENERGY_LEVELS.map((e) => (
          <Chip key={e.value} active={energyLevel === e.value} disabled={pending} onClick={() => handlePick(e.value)}>
            {e.label}
          </Chip>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Optional — helps us tune today&apos;s plan.</p>
    </Card>
  );
}
