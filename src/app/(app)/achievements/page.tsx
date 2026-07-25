import { getAchievementsWithProgress } from "@/lib/queries/achievements";
import { AchievementsGrid } from "./achievements-grid";

export default async function AchievementsPage() {
  const items = await getAchievementsWithProgress();
  const unlockedCount = items.filter((i) => i.unlocked).length;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Achievements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {unlockedCount} of {items.length} badges unlocked. Every one is a small win worth
          celebrating.
        </p>
      </header>

      <AchievementsGrid items={items} />
    </div>
  );
}
