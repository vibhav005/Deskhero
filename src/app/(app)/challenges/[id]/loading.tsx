import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function ChallengeDetailLoading() {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </header>

      <Card className="p-5">
        <Skeleton className="h-5 w-28" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="mt-3 h-11 w-full" />
        ))}
      </Card>
    </div>
  );
}
