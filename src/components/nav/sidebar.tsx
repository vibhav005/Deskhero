"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { levelForXp } from "@/lib/logic";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/app/logo";
import { PixelHero } from "@/components/app/pixel-hero";
import { isNavItemActive, NAV_ITEMS } from "./nav-items";

/** Persistent left sidebar for tablet / desktop. */
export function Sidebar() {
  const pathname = usePathname();
  const { state } = useStore();
  const lvl = levelForXp(state.xp);
  const profileItem = NAV_ITEMS.find((i) => i.href === "/profile");
  const primaryItems = NAV_ITEMS.filter((i) => i.href !== "/profile");
  const profileActive = profileItem ? isNavItemActive(pathname, profileItem.href) : false;

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 md:flex">
      <div className="px-2">
        <Logo />
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-xl bg-primary-soft/50 p-3.5">
        <PixelHero level={lvl.level} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{lvl.name}</p>
          <p className="text-xs text-muted-foreground">Level {lvl.level}</p>
        </div>
      </div>
      <Progress
        value={lvl.progress * 100}
        className="mt-3 h-1.5"
        label={`Level progress: ${Math.round(lvl.progress * 100)} percent`}
      />
      <div className="mt-2 flex items-center justify-between px-0.5 text-xs tabular-nums text-muted-foreground">
        <span>{state.xp} XP</span>
        <span className="inline-flex items-center gap-1">
          <Flame className="h-3.5 w-3.5 text-[hsl(var(--warning))]" aria-hidden />
          {state.streak}d
        </span>
      </div>

      <nav aria-label="Primary" className="mt-7 flex-1">
        <ul className="flex flex-col gap-0.5">
          {primaryItems.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 border-l-2 py-2.5 pl-3.5 pr-3 text-sm font-medium transition-colors",
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-[18px] w-[18px]", active && "text-primary")} aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {profileItem && (
        <Link
          href={profileItem.href}
          aria-current={profileActive ? "page" : undefined}
          className={cn(
            "mt-4 flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-sm font-medium transition-colors",
            profileActive
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          <profileItem.icon className="h-[18px] w-[18px]" aria-hidden />
          {profileItem.label}
        </Link>
      )}
    </aside>
  );
}
