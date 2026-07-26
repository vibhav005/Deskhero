"use client";

import { useEffect, useState, useTransition } from "react";
import { BarChart3 } from "lucide-react";
import { getMyAnalyticsConsent, updateAnalyticsConsent } from "@/lib/actions/analytics";
import { Switch } from "@/components/ui/switch";

export function AnalyticsConsentToggle() {
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    getMyAnalyticsConsent().then((value) => {
      setConsent(value);
      setLoading(false);
    });
  }, []);

  function handleChange(value: boolean) {
    setConsent(value);
    startTransition(async () => {
      await updateAnalyticsConsent(value);
    });
  }

  if (loading) return null;

  return (
    <div className="flex items-center gap-3 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
        <BarChart3 className="h-5 w-5" aria-hidden />
      </span>
      <div className="flex-1">
        <p className="font-semibold">Help improve DeskHero</p>
        <p className="text-sm text-muted-foreground">Share anonymous usage data to help us improve the app.</p>
      </div>
      <Switch checked={consent} onCheckedChange={handleChange} label="Toggle usage analytics" />
    </div>
  );
}
