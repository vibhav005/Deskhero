import { Card } from "@/components/ui/card";
import { getAdminDashboardStats } from "@/lib/queries/admin";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  const tiles = stats
    ? [
        { label: "Total users", value: stats.total_users },
        { label: "Active in last 7 days", value: stats.active_users_7d },
        { label: "Quest completions", value: stats.total_quest_completions },
        { label: "Total XP awarded", value: stats.total_xp_awarded },
        { label: "Workout completions", value: stats.total_workouts_completed },
        { label: "Active challenges", value: stats.active_challenges },
        { label: "Open feedback", value: stats.open_feedback },
      ]
    : [];

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-semibold text-muted-foreground">Overview</h2>
      {!stats ? (
        <Card className="p-5 text-sm text-muted-foreground">Couldn&apos;t load dashboard stats.</Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tiles.map((tile) => (
            <Card key={tile.label} className="p-4">
              <p className="text-2xl font-extrabold tracking-tight">{tile.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tile.label}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
