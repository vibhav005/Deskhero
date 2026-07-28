"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import Link from "next/link";
import { LogIn, Mail } from "lucide-react";
import { signIn, signInWithMagicLink, type ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";

const initialState: ActionResult = { ok: true };

export default function LoginPage() {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [passwordState, passwordAction] = useFormState(signIn, initialState);
  const [magicState, magicAction] = useFormState(signInWithMagicLink, initialState);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to pick up where you left off.</p>
      </div>

      <Card className="p-5">
        {mode === "password" ? (
          <form action={passwordAction} className="flex flex-col gap-3">
            <Field label="Email" name="email" type="email" autoComplete="email" required />
            <Field label="Password" name="password" type="password" autoComplete="current-password" required />
            {!passwordState.ok && passwordState.message && (
              <p role="alert" className="text-xs text-[hsl(var(--warning))]">
                {passwordState.message}
              </p>
            )}
            <Button type="submit" size="lg" className="mt-1 w-full">
              <LogIn className="h-5 w-5" aria-hidden />
              Sign in
            </Button>
            <div className="flex items-center justify-between text-xs">
              <button type="button" onClick={() => setMode("magic")} className="font-medium text-primary hover:underline">
                Use a magic link instead
              </button>
              <Link href="/auth/reset-password" className="text-muted-foreground hover:text-foreground">
                Forgot password?
              </Link>
            </div>
          </form>
        ) : (
          <form action={magicAction} className="flex flex-col gap-3">
            <Field label="Email" name="email" type="email" autoComplete="email" required />
            {magicState.message && (
              <p role="status" className={magicState.ok ? "text-xs text-success" : "text-xs text-[hsl(var(--warning))]"}>
                {magicState.message}
              </p>
            )}
            <Button type="submit" size="lg" className="mt-1 w-full">
              <Mail className="h-5 w-5" aria-hidden />
              Send magic link
            </Button>
            <button type="button" onClick={() => setMode("password")} className="text-xs font-medium text-primary hover:underline">
              Use password instead
            </button>
          </form>
        )}
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        New to DeskHero?{" "}
        <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

