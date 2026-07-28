import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function AchievementsLoading() {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </header>

      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Card key={i} className="flex items-center gap-3 p-4">
            <Skeleton shape="circle" className="h-12 w-12" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-3 w-48" />
              <Skeleton className="mt-2 h-2 w-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
