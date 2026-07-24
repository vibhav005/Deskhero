"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import {
  Activity,
  Droplet,
  Dumbbell,
  Flame,
  Footprints,
  Repeat,
  Trophy,
  Zap,
} from "lucide-react";
import { useStore, useTodayCompleted } from "@/lib/store";
import { dailyScore, levelForXp, weeklyConsistency } from "@/lib/logic";
import { getQuestById } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatTile } from "@/components/app/stat-tile";
import { ScoreRing } from "@/components/app/score-ring";
import { AnimatedCounter } from "@/components/app/animated-counter";
import { StreakCalendar } from "@/components/app/streak-calendar";

export default function ProgressPage() {
  const { state } = useStore();
  const completed = useTodayCompleted();

  const lvl = levelForXp(state.xp);
  const todayQuests = state.todayQuestIds
    .map((id) => getQuestById(id))
    .filter(Boolean);
  const doneToday = todayQuests.filter((q) => completed.includes(q!.id)).length;
  const score = dailyScore(doneToday, todayQuests.length);
  const consistency = weeklyConsistency(state.history, doneToday > 0);

  // Build the last 7 days for the chart (oldest → today).
  const last6 = state.history.slice(-6);
  const chartData = [
    ...last6.map((d) => ({
      day: new Date(d.date).toLocaleDateString(undefined, { weekday: "short" }),
      completed: d.completedQuestIds.length,
      isToday: false,
    })),
    {
      day: "Today",
      completed: doneToday,
      isToday: true,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Your progress</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gentle momentum over time — no pressure, just your rhythm.
        </p>
      </header>

      {/* Level + score summary */}
      <Card className="flex items-center justify-between p-5">
        <div>
          <Badge className="mb-2">Level {lvl.level}</Badge>
          <p className="text-xl font-bold">{lvl.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <AnimatedCounter value={state.xp} suffix=" total XP" />
          </p>
          <Progress
            value={lvl.progress * 100}
            className="mt-3 h-2 w-40"
            label="Level progress"
          />
        </div>
        <ScoreRing value={score} label={`Daily health score ${score}`}>
          <div className="text-center">
            <p className="text-2xl font-extrabold leading-none">
              <AnimatedCounter value={score} />
            </p>
            <p className="text-[10px] text-muted-foreground">today</p>
          </div>
        </ScoreRing>
      </Card>

      {/* Activity heatmap */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Activity</h2>
          <span className="text-sm text-muted-foreground">Last 10 weeks</span>
        </div>
        <StreakCalendar
          history={state.history}
          todayAssigned={todayQuests.length}
          todayCompleted={doneToday}
        />
      </Card>

      {/* Weekly chart */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">This week</h2>
          <span className="text-sm text-muted-foreground">
            {consistency}% consistency
          </span>
        </div>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid hsl(var(--border))",
                  fontSize: 12,
                }}
                formatter={(value: number) => [`${value} quests`, "Completed"]}
              />
              <Bar dataKey="completed" radius={[8, 8, 8, 8]} maxBarSize={34}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.isToday
                        ? "hsl(var(--accent))"
                        : "hsl(var(--primary))"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Missed a day? That&apos;s okay — a small step tomorrow still counts.
        </p>
      </Card>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile icon={Zap} label="Total XP" value={state.xp} tone="primary" />
        <StatTile
          icon={Activity}
          label="Movement breaks"
          value={state.stats.movementBreaks}
          tone="accent"
        />
        <StatTile
          icon={Dumbbell}
          label="Workouts completed"
          value={state.stats.workoutsCompleted}
          tone="success"
        />
        <StatTile
          icon={Footprints}
          label="Walking sessions"
          value={state.stats.walksCompleted}
          tone="primary"
        />
        <StatTile
          icon={Droplet}
          label="Hydration quests"
          value={state.stats.hydrationCompleted}
          tone="accent"
        />
        <StatTile
          icon={Repeat}
          label="Total quests"
          value={state.stats.questsCompleted}
          tone="muted"
        />
        <StatTile
          icon={Flame}
          label="Current streak"
          value={state.streak}
          suffix="d"
          tone="accent"
        />
        <StatTile
          icon={Trophy}
          label="Best streak"
          value={state.bestStreak}
          suffix="d"
          tone="success"
        />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        DeskHero focuses on movement and habits — never body weight or
        appearance.
      </p>
    </div>
  );
}
