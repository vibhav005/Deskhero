"use client";

import { useState, useTransition } from "react";
import { MailCheck } from "lucide-react";
import { resendVerificationEmail } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function VerifyEmailPage() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function resend() {
    setMessage(null);
    startTransition(async () => {
      const result = await resendVerificationEmail();
      setMessage(result.message ?? null);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col items-center gap-3 p-6 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
          <MailCheck className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="font-display text-xl font-semibold tracking-tight">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a verification link to your inbox. Click it to activate your account,
          then come back here.
        </p>
        <Button variant="outline" onClick={resend} disabled={pending} className="mt-2 w-full">
          {pending ? "Sending..." : "Resend email"}
        </Button>
        {message && (
          <p role="status" className="text-xs text-muted-foreground">
            {message}
          </p>
        )}
      </Card>
    </div>
  );
}
