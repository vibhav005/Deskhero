"use client";

import { useMemo, useState } from "react";
import { QUESTS } from "@/lib/data";
import type { Difficulty, QuestCategory } from "@/lib/types";
import { QuestCard } from "@/components/app/quest-card";
import { CATEGORY_LABEL } from "@/components/app/icon";
import { cn } from "@/lib/utils";

type DurationFilter = "all" | 2 | 5 | 10 | 15 | 20;
type PositionFilter = "all" | "standing" | "seated" | "no-equipment";

const DURATIONS: { value: DurationFilter; label: string }[] = [
  { value: "all", label: "Any time" },
  { value: 2, label: "2 min" },
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
];

const DIFFICULTIES: { value: "all" | Difficulty; label: string }[] = [
  { value: "all", label: "All levels" },
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "challenging", label: "Challenging" },
];

const CATEGORIES: { value: "all" | QuestCategory; label: string }[] = [
  { value: "all", label: "All" },
  ...(
    Object.keys(CATEGORY_LABEL) as QuestCategory[]
  ).map((c) => ({ value: c, label: CATEGORY_LABEL[c] })),
];

const POSITIONS: { value: PositionFilter; label: string }[] = [
  { value: "all", label: "Any" },
  { value: "standing", label: "Standing" },
  { value: "seated", label: "Seated" },
  { value: "no-equipment", label: "No equipment" },
];

/** Round a quest's minutes to the nearest library bucket for filtering. */
function bucket(minutes: number): 2 | 5 | 10 | 15 | 20 {
  if (minutes <= 2) return 2;
  if (minutes <= 5) return 5;
  if (minutes <= 10) return 10;
  if (minutes <= 15) return 15;
  return 20;
}

export default function QuestLibraryPage() {
  const [duration, setDuration] = useState<DurationFilter>("all");
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");
  const [category, setCategory] = useState<"all" | QuestCategory>("all");
  const [position, setPosition] = useState<PositionFilter>("all");

  const filtered = useMemo(() => {
    return QUESTS.filter((q) => {
      if (duration !== "all" && bucket(q.minutes) !== duration) return false;
      if (difficulty !== "all" && q.difficulty !== difficulty) return false;
      if (category !== "all" && q.category !== category) return false;
      if (position === "standing" && q.position === "seated") return false;
      if (position === "seated" && q.position === "standing") return false;
      if (position === "no-equipment" && !q.equipmentFree) return false;
      return true;
    });
  }, [duration, difficulty, category, position]);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Quest library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse short, equipment-free quests and start whenever you have a
          moment.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <FilterRow label="Duration">
          {DURATIONS.map((d) => (
            <Chip
              key={String(d.value)}
              active={duration === d.value}
              onClick={() => setDuration(d.value)}
            >
              {d.label}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Category">
          {CATEGORIES.map((c) => (
            <Chip
              key={c.value}
              active={category === c.value}
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Difficulty">
          {DIFFICULTIES.map((d) => (
            <Chip
              key={d.value}
              active={difficulty === d.value}
              onClick={() => setDifficulty(d.value)}
            >
              {d.label}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Setup">
          {POSITIONS.map((p) => (
            <Chip
              key={p.value}
              active={position === p.value}
              onClick={() => setPosition(p.value)}
            >
              {p.label}
            </Chip>
          ))}
        </FilterRow>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {filtered.length} quest{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No quests match these filters yet. Try widening your choices — every
          option here is achievable.
        </div>
      )}
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {children}
      </div>
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
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
