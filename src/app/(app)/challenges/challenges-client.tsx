"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Ticket, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createChallenge, joinChallengeByCode, joinPublicChallenge } from "@/lib/actions/challenges";
import type { ChallengeSummary, MyChallengeRow } from "@/lib/queries/challenges";

const VISIBILITY_LABEL: Record<ChallengeSummary["visibility"], string> = {
  public: "Public",
  invite_code: "Invite code",
  private: "Private",
};

export function ChallengesClient({
  mine,
  browse,
}: {
  mine: MyChallengeRow[];
  browse: ChallengeSummary[];
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleJoinByCode() {
    if (!joinCode.trim()) return;
    setJoinError(null);
    startTransition(async () => {
      const result = await joinChallengeByCode({ inviteCode: joinCode });
      if (result.ok && result.challengeId) {
        router.push(`/challenges/${result.challengeId}`);
      } else {
        setJoinError(result.message ?? "Couldn't join with that code.");
      }
    });
  }

  function handleJoinPublic(challengeId: string) {
    startTransition(async () => {
      const result = await joinPublicChallenge({ challengeId });
      if (result.ok) router.push(`/challenges/${challengeId}`);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="font-semibold">Have an invite code?</h2>
        </div>
        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="e.g. SMOKE123"
            maxLength={20}
            className="flex-1 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base uppercase tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button onClick={handleJoinByCode} disabled={pending || !joinCode.trim()}>
            Join
          </Button>
        </div>
        {joinError && (
          <p role="alert" className="text-xs text-[hsl(var(--warning))]">
            {joinError}
          </p>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Your challenges</h2>
        <Button size="sm" variant="outline" onClick={() => setShowCreate((v) => !v)}>
          <Plus className="h-4 w-4" aria-hidden />
          New challenge
        </Button>
      </div>

      {showCreate && <CreateChallengeForm onClose={() => setShowCreate(false)} />}

      {mine.length === 0 ? (
        <Card className="p-5 text-sm text-muted-foreground">
          You haven&apos;t joined a challenge yet. Create one or join with an invite code.
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {mine.map((m) => (
            <Link key={m.challenges.id} href={`/challenges/${m.challenges.id}`}>
              <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:border-primary/40">
                <div>
                  <p className="font-semibold">{m.challenges.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {VISIBILITY_LABEL[m.challenges.visibility]}
                    {m.role === "owner" ? " · You're the owner" : ""}
                  </p>
                </div>
                <Badge variant={m.challenges.status === "active" ? "default" : "muted"}>
                  {m.challenges.status === "active" ? "Active" : m.challenges.status}
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <h2 className="font-semibold">Browse public challenges</h2>
      {browse.length === 0 ? (
        <Card className="p-5 text-sm text-muted-foreground">No public challenges open right now.</Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {browse.map((c) => (
            <Card key={c.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{c.name}</p>
                {c.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                )}
              </div>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => handleJoinPublic(c.id)}>
                <Users className="h-4 w-4" aria-hidden />
                Join
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateChallengeForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<ChallengeSummary["visibility"]>("invite_code");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createChallenge({
        name,
        description: description || undefined,
        visibility,
        maxMembers: 30,
        rankingMetric: "participation",
      });
      if (result.ok && result.challengeId) {
        router.push(`/challenges/${result.challengeId}`);
      } else {
        setError(result.message ?? "Couldn't create the challenge.");
      }
    });
  }

  return (
    <Card className="flex flex-col gap-3 p-5">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Description (optional)
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={2}
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <div>
        <p className="mb-2 text-sm font-medium">Who can join</p>
        <div className="flex gap-2">
          {(["invite_code", "public"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVisibility(v)}
              className={
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors " +
                (visibility === v
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground")
              }
            >
              {VISIBILITY_LABEL[v]}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p role="alert" className="text-xs text-[hsl(var(--warning))]">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button onClick={handleCreate} disabled={pending || name.trim().length < 3}>
          Create
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
