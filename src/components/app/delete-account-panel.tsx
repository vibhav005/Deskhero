"use client";

import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteMyAccount } from "@/lib/actions/privacy";

export function DeleteAccountPanel() {
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setMessage(null);
    startTransition(async () => {
      const result = await deleteMyAccount({ password });
      if (result && !result.ok) {
        setMessage(result.message ?? "Couldn't delete your account.");
      }
      // On success the action redirects itself, so there's nothing else to do here.
    });
  }

  return (
    <Card className="flex flex-col gap-3 border-[hsl(var(--warning)/0.4)] p-5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-[hsl(var(--warning))]" aria-hidden />
        <h2 className="font-semibold">Delete account</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Permanently deletes your account and everything tied to it. Any challenges you created are
        deleted for all members. This can&apos;t be undone.
      </p>

      {!confirming ? (
        <Button variant="outline" size="sm" onClick={() => setConfirming(true)} className="w-full sm:w-auto">
          Delete my account
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Confirm your password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          {message && (
            <p role="alert" className="text-xs text-[hsl(var(--warning))]">
              {message}
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="accent" size="sm" disabled={pending || !password} onClick={handleDelete}>
              Permanently delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
