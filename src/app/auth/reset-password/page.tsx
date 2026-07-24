"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { Send } from "lucide-react";
import { requestPasswordReset, type ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const initialState: ActionResult = { ok: true };

export default function ResetPasswordPage() {
  const [state, formAction] = useFormState(requestPasswordReset, initialState);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll email you a link to set a new password.
        </p>
      </div>

      <Card className="p-5">
        <form action={formAction} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          {state.message && (
            <p role="status" className={state.ok ? "text-xs text-success" : "text-xs text-[hsl(var(--warning))]"}>
              {state.message}
            </p>
          )}
          <Button type="submit" size="lg" className="mt-1 w-full">
            <Send className="h-5 w-5" aria-hidden />
            Send reset link
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/auth/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
