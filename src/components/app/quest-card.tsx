import Link from "next/link";
import { ChevronRight, Clock, Zap } from "lucide-react";
import type { Database } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { categoryIcon, CATEGORY_LABEL } from "@/components/app/icon";

type Activity = Database["public"]["Tables"]["activities"]["Row"];

const DIFFICULTY_LABEL: Record<Activity["difficulty"], string> = {
  easy: "Easy",
  moderate: "Moderate",
  challenging: "Challenging",
};

const DIFFICULTY_TONE: Record<Activity["difficulty"], "success" | "warning" | "accent"> = {
  easy: "success",
  moderate: "warning",
  challenging: "accent",
};

export function QuestCard({ quest }: { quest: Activity }) {
  const Icon = categoryIcon(quest.category as never);
  return (
    <Link href={`/quests/${quest.slug}`} className="group block">
      <Card className="flex flex-col p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold leading-snug">{quest.title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {CATEGORY_LABEL[quest.category as never]}
            </p>
          </div>
          <ChevronRight
            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Badge variant="muted">
            <Clock className="h-3 w-3" aria-hidden /> {quest.minutes} min
          </Badge>
          <Badge variant={DIFFICULTY_TONE[quest.difficulty]}>
            {DIFFICULTY_LABEL[quest.difficulty]}
          </Badge>
          <Badge variant="default">
            <Zap className="h-3 w-3" aria-hidden /> {quest.xp_value} XP
          </Badge>
          {quest.position !== "either" && (
            <Badge variant="outline">
              {quest.position === "standing" ? "Standing" : "Seated"}
            </Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}
