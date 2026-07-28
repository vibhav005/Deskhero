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
import { getProgressData } from "@/lib/queries/progress";
import { getDashboardData } from "@/lib/queries/dashboard";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatTile } from "@/components/app/stat-tile";
import { ScoreRing } from "@/components/app/score-ring";
import { AnimatedCounter } from "@/components/app/animated-counter";
import { StreakCalendar } from "@/components/app/streak-calendar";
import { ProgressChart } from "./progress-chart";

export default async function ProgressPage() {
  const [progress, dashboard] = await Promise.all([getProgressData(), getDashboardData()]);
  if (!progress) return null;

  const { xp, level, streak, bestStreak, stats, history } = progress;
  const todayAssigned = dashboard?.quests.length ?? 0;
  const todayCompleted = dashboard?.doneCount ?? 0;
  const score = dashboard?.score ?? 0;
  const consistency = dashboard?.weeklyConsistency ?? 0;

  const chartData = history.slice(-7).map((d) => ({
    day: new Date(d.date).toLocaleDateString(undefined, { weekday: "short" }),
    completed: d.completedQuestIds.length,
  }));

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Your progress</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gentle momentum over time — no pressure, just your rhythm.
        </p>
      </header>

      <Card className="flex items-center justify-between p-5">
        <div>
          <Badge className="mb-2">Level {level.level}</Badge>
          <p className="text-xl font-bold">{level.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <AnimatedCounter value={xp} suffix=" total XP" />
          </p>
          <Progress value={level.progress * 100} className="mt-3 h-2 w-40" label="Level progress" />
        </div>
        <ScoreRing value={score} label={`Daily health score ${score}`}>
          <div className="text-center">
            <p className="text-2xl font-extrabold leading-none">
              <AnimatedCounter value={score} />
            </p>
            <p className="text-2xs text-muted-foreground">today</p>
          </div>
        </ScoreRing>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Activity</h2>
          <span className="text-sm text-muted-foreground">Last 10 weeks</span>
        </div>
        <StreakCalendar history={history} todayAssigned={todayAssigned} todayCompleted={todayCompleted} />
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">This week</h2>
          <span className="text-sm text-muted-foreground">{consistency}% consistency</span>
        </div>
        <ProgressChart data={chartData} />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Missed a day? That&apos;s okay — a small step tomorrow still counts.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatTile icon={Zap} label="Total XP" value={xp} tone="primary" />
        <StatTile
          icon={Activity}
          label="Movement breaks"
          value={stats.mobility_completed + stats.posture_completed}
          tone="accent"
        />
        <StatTile
          icon={Dumbbell}
          label="Workouts completed"
          value={stats.workouts_completed}
          tone="success"
        />
        <StatTile icon={Footprints} label="Walking sessions" value={stats.walks_completed} tone="primary" />
        <StatTile icon={Droplet} label="Hydration quests" value={stats.hydration_completed} tone="accent" />
        <StatTile icon={Repeat} label="Total quests" value={stats.quests_completed} tone="muted" />
        <StatTile icon={Flame} label="Current streak" value={streak} suffix="d" tone="accent" />
        <StatTile icon={Trophy} label="Best streak" value={bestStreak} suffix="d" tone="success" />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        DeskHero focuses on movement and habits — never body weight or appearance.
      </p>
    </div>
  );
}
