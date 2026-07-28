import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const calloutVariants = cva("flex gap-3 rounded-r-lg border-l-[3px] py-3 pl-4 pr-4", {
  variants: {
    tone: {
      neutral: "border-border bg-muted/40",
      primary: "border-primary bg-primary-soft/60",
      warning: "border-[hsl(var(--warning))] bg-warning-soft",
      success: "border-success bg-success-soft",
    },
  },
  defaultVariants: { tone: "neutral" },
});

const iconToneClass: Record<NonNullable<VariantProps<typeof calloutVariants>["tone"]>, string> = {
  neutral: "text-muted-foreground",
  primary: "text-primary",
  warning: "text-[hsl(var(--warning))]",
  success: "text-success",
};

export interface CalloutProps extends VariantProps<typeof calloutVariants> {
  icon?: LucideIcon;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}

// A quieter alternative to a full bordered Card for safety notes / inline
// warnings — a left accent strip instead of a boxed panel.
export function Callout({ icon: Icon, title, children, tone = "neutral", className }: CalloutProps) {
  return (
    <div className={cn(calloutVariants({ tone }), className)}>
      {Icon && (
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconToneClass[tone ?? "neutral"])} aria-hidden />
      )}
      <div className="text-sm leading-relaxed text-foreground">
        {title ? (
          <>
            <p className="font-medium">{title}</p>
            <div className="mt-0.5 text-muted-foreground">{children}</div>
          </>
        ) : (
          <div className="font-medium">{children}</div>
        )}
      </div>
    </div>
  );
}
