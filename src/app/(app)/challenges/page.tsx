import { listBrowseChallenges, listMyChallenges } from "@/lib/queries/challenges";
import { ChallengesClient } from "./challenges-client";

export default async function ChallengesPage() {
  const [mine, browse] = await Promise.all([listMyChallenges(), listBrowseChallenges()]);

  const myChallengeIds = new Set(mine.map((m) => m.challenges.id));
  const browseNotJoined = browse.filter((c) => !myChallengeIds.has(c.id));

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Challenges</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Team up with a small group to keep each other moving.
        </p>
      </header>

      <ChallengesClient mine={mine} browse={browseNotJoined} />
    </div>
  );
}
