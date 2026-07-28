import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function FeedbackAdminLoading() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-5 w-28" />
      <div className="flex flex-col gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
