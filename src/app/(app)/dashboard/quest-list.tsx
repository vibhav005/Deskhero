"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { categoryIcon, CATEGORY_LABEL } from "@/components/app/icon";
import { completeQuest } from "@/lib/actions/quests";
import { cn } from "@/lib/utils";
import type { DashboardQuest } from "@/lib/queries/dashboard";

export function QuestList({ quests }: { quests: DashboardQuest[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleComplete(dailyQuestId: string) {
    startTransition(async () => {
      const result = await completeQuest({ dailyQuestId });
      if (result.ok) router.refresh();
    });
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {quests.map((quest, i) => {
        const isDone = quest.status === "completed";
        const Icon = categoryIcon(quest.activity.category as never);
        return (
          <motion.li
            key={quest.dailyQuestId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <Card
              className={cn(
                "flex items-center gap-3 p-3 transition-colors",
                isDone && "bg-success-soft/40",
              )}
            >
              <Link
                href={`/quests/${quest.activity.slug}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <span
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-full",
                    isDone ? "bg-success text-success-foreground" : "bg-primary-soft text-primary",
                  )}
                >
                  {isDone ? (
                    <Check className="h-5 w-5" aria-hidden />
                  ) : (
                    <Icon className="h-5 w-5" aria-hidden />
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block truncate text-sm font-semibold",
                      isDone && "text-muted-foreground line-through",
                    )}
                  >
                    {quest.activity.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {CATEGORY_LABEL[quest.activity.category as never]} · {quest.activity.minutes} min ·{" "}
                    {quest.activity.xp_value} XP
                  </span>
                </span>
              </Link>
              {isDone ? (
                <span className="shrink-0 pr-1 text-xs font-semibold text-success">Done</span>
              ) : (
                <Button
                  size="sm"
                  variant="subtle"
                  onClick={() => handleComplete(quest.dailyQuestId)}
                  disabled={pending}
                  aria-label={`Mark ${quest.activity.title} complete`}
                >
                  Complete
                </Button>
              )}
            </Card>
          </motion.li>
        );
      })}
    </ul>
  );
}
