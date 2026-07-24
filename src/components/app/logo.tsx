import { cn } from "@/lib/utils";

/** Original abstract mark: a rising spark inside a rounded badge. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-glow-primary",
        className,
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-2/3 w-2/3"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* upward arc = rising energy / movement */}
        <path d="M4 15c2.5-5 5-7 8-7s5.5 2 8 7" />
        {/* spark dot */}
        <circle cx="12" cy="6.5" r="1.6" fill="currentColor" stroke="none" />
        {/* grounded base */}
        <path d="M6.5 19h11" />
      </svg>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-9 w-9" />
      <span className="text-xl font-extrabold tracking-tight text-foreground">
        Desk<span className="text-primary">Hero</span>
      </span>
    </span>
  );
}
