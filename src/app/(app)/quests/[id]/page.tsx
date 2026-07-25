import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { getActivityDetail } from "@/lib/queries/quest-library";
import { QuestDetailClient } from "./quest-detail-client";

export default async function QuestDetailPage({ params }: { params: { id: string } }) {
  const detail = await getActivityDetail(params.id);

  if (!detail) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg font-semibold">Quest not found</p>
        <Link href="/quests" className={buttonVariants({ variant: "outline" })}>
          Back to library
        </Link>
      </div>
    );
  }

  return <QuestDetailClient detail={detail} />;
}
