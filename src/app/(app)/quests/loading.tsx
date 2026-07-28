import { Skeleton } from "@/components/ui/skeleton";

export default function QuestsLoading() {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </header>

      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-16" />
            <div className="flex gap-2">
              {[0, 1, 2].map((j) => (
                <Skeleton key={j} className="h-8 w-20 rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} shape="rect" className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}
