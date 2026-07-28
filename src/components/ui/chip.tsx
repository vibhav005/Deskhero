"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/** Toggle-pill button used for filters and single-select preference groups. */
export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ active, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={!!active}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    />
  ),
);
Chip.displayName = "Chip";
