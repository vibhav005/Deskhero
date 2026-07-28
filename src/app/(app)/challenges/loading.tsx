import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function ChallengesLoading() {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-56" />
      </header>

      <Card className="p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-3 h-11 w-full" />
      </Card>

      <Skeleton className="h-5 w-32" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} shape="rect" className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
