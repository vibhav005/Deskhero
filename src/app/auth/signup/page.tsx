"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { signUp, type ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const initialState: ActionResult = { ok: true };

export default function SignupPage() {
  const [state, formAction] = useFormState(signUp, initialState);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Free, always. No payment details, ever.</p>
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
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Password
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
