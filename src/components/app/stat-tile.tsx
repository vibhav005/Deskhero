import type { LucideIcon } from "lucide-react";
import { AnimatedCounter } from "@/components/app/animated-counter";
import { cn } from "@/lib/utils";

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  /** Appended after the value when it animates (e.g. "d" for days). Ignored for string values. */
  suffix?: string;
  tone?: "primary" | "accent" | "success" | "muted";
  className?: string;
}

const TONES: Record<NonNullable<StatTileProps["tone"]>, string> = {
  primary: "bg-primary-soft text-primary",
  accent: "bg-accent-soft text-accent-foreground",
  success: "bg-success-soft text-success",
  muted: "bg-muted text-muted-foreground",
};

export function StatTile({
  icon: Icon,
  label,
  value,
  suffix = "",
  tone = "primary",
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft",
        className,
      )}
    >
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", TONES[tone])}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none">
          {typeof value === "number" ? (
            <AnimatedCounter value={value} suffix={suffix} />
          ) : (
            value
          )}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
