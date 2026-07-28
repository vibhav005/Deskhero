"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { reviewFeedback } from "@/lib/actions/admin";
import type { AdminFeedbackRow } from "@/lib/queries/admin";

const STATUS_VARIANT: Record<string, "warning" | "default" | "muted"> = {
  open: "warning",
  reviewed: "default",
  resolved: "muted",
};

export function FeedbackAdminClient({ feedback }: { feedback: AdminFeedbackRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setStatus(feedbackId: string, status: "open" | "reviewed" | "resolved") {
    startTransition(async () => {
      await reviewFeedback({ feedbackId, status });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-semibold text-muted-foreground">Feedback ({feedback.length})</h2>
      {feedback.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No feedback yet" />
      ) : (
        <div className="flex flex-col gap-2.5">
          {feedback.map((f) => (
            <Card key={f.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={STATUS_VARIANT[f.status] ?? "muted"}>{f.status}</Badge>
                  <span>{f.category}</span>
                  {f.target_type && <span>· {f.target_type}</span>}
                </div>
                <span className="text-xs text-muted-foreground">
                  {f.created_at.slice(0, 10)}
                </span>
              </div>
              {f.comments && <p className="text-sm">{f.comments}</p>}
              <div className="flex gap-2">
                {f.status !== "reviewed" && (
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus(f.id, "reviewed")}>
                    Mark reviewed
                  </Button>
                )}
                {f.status !== "resolved" && (
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus(f.id, "resolved")}>
                    Mark resolved
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
