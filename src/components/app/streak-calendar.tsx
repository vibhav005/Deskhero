"use client";

import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { todayKey, cn } from "@/lib/utils";

/** Only the fields this component actually reads — deliberately looser than
 * the legacy DayRecord type so any day-record-shaped data source works. */
interface HistoryDay {
  date: string;
  completedQuestIds: unknown[];
  assigned: number;
}

interface StreakCalendarProps {
  history: HistoryDay[];
  todayAssigned: number;
  todayCompleted: number;
  weeks?: number;
  className?: string;
}

type Cell = { date: string; level: 0 | 1 | 2 | 3 | 4 } | null;

const LEVEL_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-muted",
  1: "bg-primary/20",
  2: "bg-primary/45",
  3: "bg-primary/70",
  4: "bg-primary",
};

function levelFor(ratio: number): 0 | 1 | 2 | 3 | 4 {
  if (ratio <= 0) return 0;
  if (ratio < 0.34) return 1;
  if (ratio < 0.67) return 2;
  if (ratio < 1) return 3;
  return 4;
}

/** Build a GitHub-style grid of week columns, padded so the first column starts on Sunday. */
function buildWeeks(
  history: HistoryDay[],
  todayAssigned: number,
  todayCompleted: number,
  weeks: number,
): Cell[][] {
  const byDate = new Map(history.map((h) => [h.date, h]));
  const todayStr = todayKey();
  const daysBack = weeks * 7 - 1;

  const start = new Date();
  start.setDate(start.getDate() - daysBack);

  const cells: Cell[] = new Array(start.getDay()).fill(null);

  for (let i = 0; i <= daysBack; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = todayKey(d);

    let ratio = 0;
    if (key === todayStr) {
      ratio = todayAssigned > 0 ? todayCompleted / todayAssigned : 0;
    } else {
      const rec = byDate.get(key);
      if (rec && rec.assigned > 0) ratio = rec.completedQuestIds.length / rec.assigned;
    }
    cells.push({ date: key, level: levelFor(ratio) });
  }

  const result: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    result.push(cells.slice(i, i + 7));
  }
  return result;
}

/** A calm, GitHub-style activity heatmap built from daily quest completion. */
export function StreakCalendar({
  history,
  todayAssigned,
  todayCompleted,
  weeks = 10,
  className,
}: StreakCalendarProps) {
  const { state } = useStore();
  const reduced = state.settings.reducedMotion;
  const cols = buildWeeks(history, todayAssigned, todayCompleted, weeks);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex w-max gap-[3px]">
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px]">
              {col.map((cell, ri) =>
                cell ? (
                  <motion.span
                    key={cell.date}
                    title={`${cell.date} · level ${cell.level} of 4`}
                    initial={reduced ? false : { opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: reduced ? 0 : (ci * 7 + ri) * 0.003,
                      duration: 0.25,
                    }}
                    className={cn(
                      "h-[11px] w-[11px] rounded-[3px]",
                      LEVEL_CLASS[cell.level],
                    )}
                  />
                ) : (
                  <span key={ri} className="h-[11px] w-[11px]" />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 text-2xs text-muted-foreground">
        <span>Less</span>
        {([0, 1, 2, 3, 4] as const).map((lvl) => (
          <span key={lvl} className={cn("h-[11px] w-[11px] rounded-[3px]", LEVEL_CLASS[lvl])} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
