"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Target, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { upsertWeeklyPlan } from "@/lib/actions/weekly-plan";
import { createGoal, deactivateGoal } from "@/lib/actions/goals";
import { DAY_TYPE_VALUES, type DayType } from "@/lib/validation/weekly-plan.schema";
import { GOAL_TYPE_VALUES, GOAL_LABEL, GOAL_MAX, type GoalType } from "@/lib/validation/goals.schema";
import type { WeeklyPlanData } from "@/lib/queries/weekly-plan";
import type { GoalWithProgress } from "@/lib/queries/goals";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DAY_TYPE_LABEL: Record<DayType, string> = {
  workout: "Workout",
  light: "Light",
  recovery: "Recovery",
  rest: "Rest",
  work_heavy: "Work-heavy",
};

const DEFAULT_DAYS: DayType[] = ["workout", "light", "workout", "light", "workout", "rest", "rest"];

export function WeeklyPlanClient({
  initialPlan,
  initialGoals,
}: {
  initialPlan: WeeklyPlanData | null;
  initialGoals: GoalWithProgress[];
}) {
  const [days, setDays] = useState<DayType[]>(
    () => (initialPlan?.days.map((d) => d ?? "light") as DayType[] | undefined) ?? DEFAULT_DAYS,
  );
  const [activeDaysTarget, setActiveDaysTarget] = useState(initialPlan?.activeDaysTarget ?? 5);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      const result = await upsertWeeklyPlan({ activeDaysTarget, days });
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4 p-5">
        <div>
          <p className="text-sm font-semibold">Active days this week</p>
          <p className="text-xs text-muted-foreground">How many days you&apos;re aiming to be active.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <Chip key={n} active={activeDaysTarget === n} onClick={() => setActiveDaysTarget(n)}>
              {n}
            </Chip>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DAY_LABELS.map((label, i) => (
            <label key={label} className="flex flex-col gap-1.5 text-sm font-medium">
              {label}
              <Select
                value={days[i]}
                onChange={(e) => {
                  const next = [...days];
                  next[i] = e.target.value as DayType;
                  setDays(next);
                }}
              >
                {DAY_TYPE_VALUES.map((dt) => (
                  <option key={dt} value={dt}>
                    {DAY_TYPE_LABEL[dt]}
                  </option>
                ))}
              </Select>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleSave} loading={pending}>
            <Save className="h-4 w-4" aria-hidden />
            Save weekly plan
          </Button>
          {saved && <span className="text-xs font-medium text-success">Saved</span>}
        </div>
      </Card>

      <GoalsSection initialGoals={initialGoals} />
    </div>
  );
}

function GoalsSection({ initialGoals }: { initialGoals: GoalWithProgress[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [goalType, setGoalType] = useState<GoalType>("consistency_days");
  const [targetValue, setTargetValue] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createGoal({ goalType, targetValue });
      if (result.ok) {
        setShowForm(false);
        router.refresh();
      } else {
        setError(result.message ?? "Couldn't save that goal.");
      }
    });
  }

  function handleDeactivate(goalId: string) {
    startTransition(async () => {
      await deactivateGoal({ goalId });
      router.refresh();
    });
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Your goals</p>
          <p className="text-xs text-muted-foreground">Custom weekly targets, tracked from your real completions.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" aria-hidden />
          New goal
        </Button>
      </div>

      {showForm && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Goal
            <Select value={goalType} onChange={(e) => setGoalType(e.target.value as GoalType)}>
              {GOAL_TYPE_VALUES.map((gt) => (
                <option key={gt} value={gt}>
                  {GOAL_LABEL[gt]}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Target (up to {GOAL_MAX[goalType]})
            <Input
              type="number"
              min={1}
              max={GOAL_MAX[goalType]}
              value={targetValue}
              onChange={(e) => setTargetValue(Number(e.target.value))}
            />
          </label>
          {error && (
            <p role="alert" className="text-xs text-[hsl(var(--warning))]">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button size="sm" loading={pending} onClick={handleCreate}>
              Add goal
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {initialGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Add a custom weekly target to track alongside your quests."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {initialGoals.map((g) => (
            <div key={g.id} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-medium">{g.label}</p>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {g.progress} / {g.targetValue}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (g.progress / g.targetValue) * 100)}
                  label={`${g.label} progress`}
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                disabled={pending}
                onClick={() => handleDeactivate(g.id)}
                aria-label={`Remove ${g.label}`}
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
