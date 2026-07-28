import { listBrowseChallenges, listMyChallenges } from "@/lib/queries/challenges";
import { PageHeader } from "@/components/app/page-header";
import { ChallengesClient } from "./challenges-client";

export default async function ChallengesPage() {
  const [mine, browse] = await Promise.all([listMyChallenges(), listBrowseChallenges()]);

  const myChallengeIds = new Set(mine.map((m) => m.challenges.id));
  const browseNotJoined = browse.filter((c) => !myChallengeIds.has(c.id));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Challenges"
        description="Team up with a small group to keep each other moving."
      />

      <ChallengesClient mine={mine} browse={browseNotJoined} />
    </div>
  );
}
