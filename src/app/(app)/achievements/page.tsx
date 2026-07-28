import { getAchievementsWithProgress } from "@/lib/queries/achievements";
import { PageHeader } from "@/components/app/page-header";
import { AchievementsGrid } from "./achievements-grid";

export default async function AchievementsPage() {
  const items = await getAchievementsWithProgress();
  const unlockedCount = items.filter((i) => i.unlocked).length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Achievements"
        description={`${unlockedCount} of ${items.length} badges unlocked. Every one is a small win worth celebrating.`}
      />

      <AchievementsGrid items={items} />
    </div>
  );
}
