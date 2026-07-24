"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { levelForXp } from "@/lib/logic";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/app/logo";
import { NAV_ITEMS } from "./nav-items";

/** Persistent left sidebar for tablet / desktop. */
export function Sidebar() {
  const pathname = usePathname();
  const { state } = useStore();
  const lvl = levelForXp(state.xp);

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 md:flex">
      <div className="px-2">
        <Logo />
      </div>

      <div className="mt-6 rounded-2xl bg-primary-soft/60 p-4">
        <p className="text-xs font-medium text-muted-foreground">
          Level {lvl.level}
        </p>
        <p className="text-base font-semibold text-foreground">{lvl.name}</p>
        <Progress
          value={lvl.progress * 100}
          className="mt-2 h-2"
          label={`Level progress: ${Math.round(lvl.progress * 100)} percent`}
        />
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{state.xp} XP</span>
          <span className="inline-flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 text-accent" aria-hidden />
            {state.streak}d
          </span>
        </div>
      </div>

      <nav aria-label="Primary" className="mt-6 flex-1">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="px-2 text-[11px] leading-relaxed text-muted-foreground">
        Prototype data is stored only in this browser.
      </p>
    </aside>
  );
}
