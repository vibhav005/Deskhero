"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { signUp, type ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

const initialState: ActionResult = { ok: true };

export default function SignupPage() {
  const [state, formAction] = useFormState(signUp, initialState);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Free, always. No payment details, ever.</p>
      </div>

      <Card className="p-5">
        <form action={formAction} className="flex flex-col gap-3">
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            hint="At least 8 characters."
          />
          {!state.ok && state.message && (
            <p role="alert" className="text-xs text-[hsl(var(--warning))]">
              {state.message}
            </p>
          )}
          <Button type="submit" size="lg" className="mt-1 w-full">
            <UserPlus className="h-5 w-5" aria-hidden />
            Create account
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
