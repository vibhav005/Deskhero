import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { getActivityDetail, getWorkoutSteps } from "@/lib/queries/quest-library";
import { WorkoutPlayer } from "./workout-player";

export default async function WorkoutPage({
  searchParams,
}: {
  searchParams: { quest?: string };
}) {
  const slug = searchParams.quest;
  const detail = slug ? await getActivityDetail(slug) : null;
  const steps = detail?.activity.workout_id
    ? await getWorkoutSteps(detail.activity.workout_id)
    : [];

  if (!detail || steps.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg font-semibold">Workout not found</p>
        <Link href="/quests" className={buttonVariants({ variant: "outline" })}>
          Back to library
        </Link>
      </div>
    );
  }

  return <WorkoutPlayer detail={detail} steps={steps} />;
}
