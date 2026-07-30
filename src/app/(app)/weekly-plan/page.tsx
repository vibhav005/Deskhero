import { getMyWeeklyPlan } from "@/lib/queries/weekly-plan";
import { getMyGoalsWithProgress } from "@/lib/queries/goals";
import { PageHeader } from "@/components/app/page-header";
import { WeeklyPlanClient } from "./weekly-plan-client";

export default async function WeeklyPlanPage() {
  const [plan, goals] = await Promise.all([getMyWeeklyPlan(), getMyGoalsWithProgress()]);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Weekly plan"
        description="Set an intention for each day — a real-time check-in always overrides it, so nothing here is a hard rule."
      />
      <WeeklyPlanClient initialPlan={plan} initialGoals={goals} />
    </div>
  );
}
