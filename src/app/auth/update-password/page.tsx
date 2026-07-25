"use client";

import { useFormState } from "react-dom";
import { KeyRound } from "lucide-react";
import { updatePassword, type ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const initialState: ActionResult = { ok: true };

export default function UpdatePasswordPage() {
  const [state, formAction] = useFormState(updatePassword, initialState);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose a new password for your account.</p>
      </div>

      <Card className="p-5">
        <form action={formAction} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            New password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span className="text-xs font-normal text-muted-foreground">At least 8 characters.</span>
          </label>
          {!state.ok && state.message && (
            <p role="alert" className="text-xs text-[hsl(var(--warning))]">
              {state.message}
            </p>
          )}
          <Button type="submit" size="lg" className="mt-1 w-full">
            <KeyRound className="h-5 w-5" aria-hidden />
            Update password
          </Button>
        </form>
      </Card>
    </div>
  );
}
