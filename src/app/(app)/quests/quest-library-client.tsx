"use client";

import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import type { Database } from "@/types/database";
import { QuestCard } from "@/components/app/quest-card";
import { PageHeader } from "@/components/app/page-header";
import { CATEGORY_LABEL } from "@/components/app/icon";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";

type Activity = Database["public"]["Tables"]["activities"]["Row"];
type Difficulty = Activity["difficulty"];
type Category = Activity["category"];

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

const CATEGORIES: { value: "all" | Category; label: string }[] = [
  { value: "all", label: "All" },
  ...(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => ({
    value: c,
    label: CATEGORY_LABEL[c as never],
  })),
];

const POSITIONS: { value: PositionFilter; label: string }[] = [
  { value: "all", label: "Any" },
  { value: "standing", label: "Standing" },
  { value: "seated", label: "Seated" },
  { value: "no-equipment", label: "No equipment" },
];

/** Round an activity's minutes to the nearest library bucket for filtering. */
function bucket(minutes: number): 2 | 5 | 10 | 15 | 20 {
  if (minutes <= 2) return 2;
  if (minutes <= 5) return 5;
  if (minutes <= 10) return 10;
  if (minutes <= 15) return 15;
  return 20;
}

export function QuestLibraryClient({ activities }: { activities: Activity[] }) {
  const [duration, setDuration] = useState<DurationFilter>("all");
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [position, setPosition] = useState<PositionFilter>("all");

  const filtered = useMemo(() => {
    return activities.filter((q) => {
      if (duration !== "all" && bucket(q.minutes) !== duration) return false;
      if (difficulty !== "all" && q.difficulty !== difficulty) return false;
      if (category !== "all" && q.category !== category) return false;
      if (position === "standing" && q.position === "seated") return false;
      if (position === "seated" && q.position === "standing") return false;
      if (position === "no-equipment" && !q.equipment_free) return false;
      return true;
    });
  }, [activities, duration, difficulty, category, position]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Quest library"
        description="Browse short, equipment-free quests and start whenever you have a moment."
      />

      <div className="flex flex-col gap-3">
        <FilterRow label="Duration">
          {DURATIONS.map((d) => (
            <Chip key={String(d.value)} active={duration === d.value} onClick={() => setDuration(d.value)}>
              {d.label}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Category">
          {CATEGORIES.map((c) => (
            <Chip key={c.value} active={category === c.value} onClick={() => setCategory(c.value)}>
              {c.label}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Difficulty">
          {DIFFICULTIES.map((d) => (
            <Chip key={d.value} active={difficulty === d.value} onClick={() => setDifficulty(d.value)}>
              {d.label}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Setup">
          {POSITIONS.map((p) => (
            <Chip key={p.value} active={position === p.value} onClick={() => setPosition(p.value)}>
              {p.label}
            </Chip>
          ))}
        </FilterRow>
      </div>

      <h2 id="results-heading" className="sr-only">
        Results
      </h2>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {filtered.length} quest{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-labelledby="results-heading">
          {filtered.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={SearchX}
          title="No quests match these filters"
          description="Try widening your choices — every option here is achievable."
        />
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">{children}</div>
    </div>
  );
}
