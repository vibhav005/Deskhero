import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function ProgressLoading() {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </header>

      <Card className="flex items-center justify-between p-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-2 w-40" />
        </div>
        <Skeleton shape="circle" className="h-16 w-16" />
      </Card>

      <Card className="p-5">
        <Skeleton className="mb-3 h-5 w-24" />
        <Skeleton shape="rect" className="h-24 w-full" />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="mt-2 h-3 w-20" />
          </Card>
        ))}
      </div>
    </div>
  );
}
