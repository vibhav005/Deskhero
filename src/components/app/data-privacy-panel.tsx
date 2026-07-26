"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportMyData, resetMyProgress } from "@/lib/actions/privacy";

export function DataPrivacyPanel() {
  const router = useRouter();
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const result = await exportMyData();
      if (!result.ok || !result.data) {
        setMessage(result.message ?? "Couldn't export your data.");
        return;
      }
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deskhero-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function handleReset() {
    startTransition(async () => {
      const result = await resetMyProgress();
      setMessage(result.message ?? null);
      if (result.ok) {
        setConfirmReset(false);
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="font-semibold">Your data</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Export everything DeskHero has stored about you, or reset your progress back to Level 1.
        </p>
      </div>

      <Button variant="outline" size="sm" disabled={pending} onClick={handleExport} className="w-full sm:w-auto">
        <Download className="h-4 w-4" aria-hidden />
        Export my data
      </Button>

      <div className="border-t border-border pt-4">
        {!confirmReset ? (
          <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reset progress
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              This deletes your quest history, XP, achievements, and challenge contributions, and
              returns you to Level 1. Your account, settings, and challenge memberships are kept.
              This can&apos;t be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="accent" size="sm" disabled={pending} onClick={handleReset}>
                Yes, reset my progress
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {message && (
        <p role="status" className="text-xs text-[hsl(var(--warning))]">
          {message}
        </p>
      )}
    </Card>
  );
}
