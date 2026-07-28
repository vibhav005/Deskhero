import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Deliberately NOT "use client" — animate-pulse is pure CSS, so this can be
// used directly from Server Components (e.g. route-level loading.tsx files).
const skeletonVariants = cva("animate-pulse bg-muted", {
  variants: {
    shape: {
      text: "rounded-md",
      circle: "rounded-full",
      rect: "rounded-2xl",
    },
  },
  defaultVariants: { shape: "text" },
});

export interface SkeletonProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export function Skeleton({ className, shape, ...props }: SkeletonProps) {
  return <div className={cn(skeletonVariants({ shape }), className)} aria-hidden {...props} />;
}
