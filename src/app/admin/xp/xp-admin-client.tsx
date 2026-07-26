"use client";

import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adjustXp, searchProfiles } from "@/lib/actions/admin";

interface SearchResult {
  user_id: string;
  display_name: string | null;
  current_xp: number;
  current_level: number;
}

export function XpAdminClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSearch() {
    if (!query.trim()) return;
    setMessage(null);
    startTransition(async () => {
      const result = await searchProfiles({ query });
      setResults(result.results);
    });
  }

  function handleAdjust() {
    if (!selected) return;
    setMessage(null);
    startTransition(async () => {
      const result = await adjustXp({ userId: selected.user_id, xpAmount: amount, reason });
      setMessage({ ok: result.ok, text: result.message ?? (result.ok ? "Done." : "Failed.") });
      if (result.ok) {
        setSelected(null);
        setAmount(0);
        setReason("");
        setResults([]);
        setQuery("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-semibold text-muted-foreground">XP adjustments</h2>

      {message && (
        <p role="status" className={message.ok ? "text-sm text-success" : "text-sm text-[hsl(var(--warning))]"}>
          {message.text}
        </p>
      )}

      <Card className="flex flex-col gap-3 p-5">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by display name"
            className="flex-1 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button size="sm" onClick={handleSearch} disabled={pending || !query.trim()}>
            <Search className="h-4 w-4" aria-hidden />
            Search
          </Button>
        </div>

        {results.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {results.map((r) => (
              <li key={r.user_id}>
                <button
                  type="button"
                  onClick={() => setSelected(r)}
                  className={
                    "w-full rounded-xl border px-3.5 py-2 text-left text-sm transition-colors " +
                    (selected?.user_id === r.user_id
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-surface hover:border-primary/40")
                  }
                >
                  {r.display_name ?? "Unnamed"} — Level {r.current_level}, {r.current_xp} XP
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {selected && (
        <Card className="flex flex-col gap-3 p-5">
          <p className="text-sm">
            Adjusting <span className="font-semibold">{selected.display_name ?? "Unnamed"}</span> (currently{" "}
            {selected.current_xp} XP)
          </p>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Amount (use a negative number to subtract)
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-40 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Reason (required, logged in the audit trail)
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={pending || amount === 0 || reason.trim().length < 3}
              onClick={handleAdjust}
            >
              Apply adjustment
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
