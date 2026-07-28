import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary-soft text-primary",
        accent: "bg-accent-soft text-accent-foreground",
        muted: "bg-muted text-muted-foreground",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-[hsl(var(--warning))]",
        outline: "border border-border text-foreground",
        bronze: "border border-tier-bronze/50 bg-tier-bronze/15 text-tier-bronze shadow-glow-bronze",
        silver: "border border-tier-silver/50 bg-tier-silver/15 text-tier-silver shadow-glow-silver",
        gold: "border border-tier-gold/50 bg-tier-gold/15 text-tier-gold shadow-glow-gold",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
