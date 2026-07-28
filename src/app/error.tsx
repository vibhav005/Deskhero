"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid min-h-dvh place-items-center bg-background p-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-warning-soft text-[hsl(var(--warning))]">
          <AlertTriangle className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Give it another try — if it keeps happening, head back to your dashboard.
        </p>
        <div className="mt-2 flex gap-2">
          <Button onClick={reset}>Try again</Button>
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
