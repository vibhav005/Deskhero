"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { Send } from "lucide-react";
import { requestPasswordReset, type ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

const initialState: ActionResult = { ok: true };

export default function ResetPasswordPage() {
  const [state, formAction] = useFormState(requestPasswordReset, initialState);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll email you a link to set a new password.
        </p>
      </div>

      <Card className="p-5">
        <form action={formAction} className="flex flex-col gap-3">
          <Field label="Email" name="email" type="email" autoComplete="email" required />
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
