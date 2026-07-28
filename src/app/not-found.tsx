import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Logo } from "@/components/app/logo";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background p-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo className="mb-1" />
        <span className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
          <SearchX className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="text-xl font-bold">Page not found</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          That page doesn&apos;t exist or may have moved.
        </p>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back home
        </Link>
      </div>
    </div>
  );
}
