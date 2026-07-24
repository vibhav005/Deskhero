import Link from "next/link";
import { Clock, Zap } from "lucide-react";
import type { Quest } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { categoryIcon, CATEGORY_LABEL } from "@/components/app/icon";
import { cn } from "@/lib/utils";

const DIFFICULTY_LABEL: Record<Quest["difficulty"], string> = {
  easy: "Easy",
  moderate: "Moderate",
  challenging: "Challenging",
};

const DIFFICULTY_TONE: Record<Quest["difficulty"], "success" | "warning" | "accent"> =
  {
    easy: "success",
    moderate: "warning",
    challenging: "accent",
  };

export function QuestCard({ quest }: { quest: Quest }) {
  const Icon = categoryIcon(quest.category);
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-snug">{quest.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {CATEGORY_LABEL[quest.category]}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge variant="muted">
          <Clock className="h-3 w-3" aria-hidden /> {quest.minutes} min
        </Badge>
        <Badge variant={DIFFICULTY_TONE[quest.difficulty]}>
          {DIFFICULTY_LABEL[quest.difficulty]}
        </Badge>
        <Badge variant="default">
          <Zap className="h-3 w-3" aria-hidden /> {quest.xp} XP
        </Badge>
        {quest.position !== "either" && (
          <Badge variant="outline">
            {quest.position === "standing" ? "Standing" : "Seated"}
          </Badge>
        )}
      </div>

      <Link
        href={`/quests/${quest.id}`}
        className={cn(buttonVariants({ size: "sm" }), "mt-4 w-full")}
      >
        Start
      </Link>
    </Card>
  );
}
