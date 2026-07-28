import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";

export default function AppNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        That page doesn&apos;t exist or may have moved.
      </p>
      <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
        Back to dashboard
      </Link>
    </div>
  );
}
