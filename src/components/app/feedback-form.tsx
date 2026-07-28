"use client";

import { useState, useTransition } from "react";
import { MessageSquarePlus, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { submitFeedback } from "@/lib/actions/feedback";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "bug", label: "Something's broken" },
  { value: "confusing_experience", label: "Confusing" },
  { value: "feature_request", label: "Feature idea" },
  { value: "exercise_feedback", label: "About an exercise" },
  { value: "reminder_feedback", label: "About reminders" },
  { value: "general", label: "General" },
] as const;

export function FeedbackForm() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("general");
  const [comments, setComments] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitFeedback({
        category,
        comments,
        rating: rating ?? undefined,
        pageContext: "profile",
        contactOk: false,
      });
      setMessage(result.message ?? null);
      if (result.ok) {
        setComments("");
        setRating(null);
        setTimeout(() => {
          setOpen(false);
          setMessage(null);
        }, 1800);
      }
    });
  }

  if (!open) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="font-semibold">Send feedback</h2>
          </div>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            Open
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2">
        <MessageSquarePlus className="h-5 w-5 text-primary" aria-hidden />
        <h2 className="font-semibold">Send feedback</h2>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              category === c.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => setRating(n)}
          >
            <Star
              className={cn(
                "h-5 w-5",
                rating !== null && n <= rating
                  ? "fill-[hsl(var(--warning))] text-[hsl(var(--warning))]"
                  : "text-muted-foreground",
              )}
              aria-hidden
            />
          </button>
        ))}
      </div>

      <textarea
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="What's on your mind?"
        className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {message && (
        <p role="status" className="text-xs text-success">
          {message}
        </p>
      )}

      <div className="flex gap-2">
        <Button size="sm" loading={pending} disabled={comments.trim().length < 5} onClick={handleSubmit}>
          Send
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
