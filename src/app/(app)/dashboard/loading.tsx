import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-48" />
      </header>

      <Card className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <Skeleton shape="circle" className="h-16 w-16" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton shape="circle" className="h-16 w-16" />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="mt-2 h-3 w-20" />
        </Card>
        <Card className="p-4">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="mt-2 h-3 w-20" />
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton shape="rect" className="h-14 w-full" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} shape="rect" className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
