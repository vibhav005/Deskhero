"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Copy, Crown, Flag, LogOut, Shield, Trophy, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Callout } from "@/components/ui/callout";
import {
  joinPublicChallenge,
  leaveChallenge,
  reportChallenge,
  setChallengeStatus,
} from "@/lib/actions/challenges";
import type { ChallengeDetail } from "@/lib/queries/challenges";

const VISIBILITY_LABEL: Record<string, string> = {
  public: "Public",
  invite_code: "Invite code",
  private: "Private",
};

export function ChallengeDetailClient({ detail, isAdmin }: { detail: ChallengeDetail; isAdmin: boolean }) {
  const { challenge, myRole, isActiveMember, leaderboard, members } = detail;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showReport, setShowReport] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleJoin() {
    startTransition(async () => {
      await joinPublicChallenge({ challengeId: challenge.id });
      router.refresh();
    });
  }

  function handleLeave() {
    startTransition(async () => {
      await leaveChallenge({ challengeId: challenge.id });
      router.refresh();
    });
  }

  function handleCopyCode() {
    if (!challenge.invite_code) return;
    navigator.clipboard?.writeText(challenge.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleAdminStatus(status: "active" | "disabled") {
    startTransition(async () => {
      await setChallengeStatus({ challengeId: challenge.id, status });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{challenge.name}</h1>
          <Badge variant="outline">{VISIBILITY_LABEL[challenge.visibility]}</Badge>
          {challenge.status !== "active" && <Badge variant="warning">{challenge.status}</Badge>}
        </div>
        {challenge.description && (
          <p className="mt-1 text-sm text-muted-foreground">{challenge.description}</p>
        )}
      </header>

      {challenge.status === "disabled" && (
        <Callout tone="warning">
          This challenge has been disabled by an admin and is no longer active for anyone.
        </Callout>
      )}

      {!isActiveMember ? (
        <Card className="flex items-center justify-between gap-3 p-5">
          <p className="text-sm text-muted-foreground">Join to see the leaderboard and contribute.</p>
          <Button disabled={pending || challenge.status !== "active"} onClick={handleJoin}>
            <Users className="h-4 w-4" aria-hidden />
            Join challenge
          </Button>
        </Card>
      ) : (
        <>
          {challenge.invite_code && (
            <Card className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Invite code</p>
                <p className="font-mono text-lg font-semibold tracking-widest">{challenge.invite_code}</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleCopyCode}>
                <Copy className="h-4 w-4" aria-hidden />
                {copied ? "Copied" : "Copy"}
              </Button>
            </Card>
          )}

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="font-semibold">Leaderboard</h2>
            </div>
            {leaderboard.length === 0 ? (
              <EmptyState
                className="mt-3 border-none p-0 text-left"
                title="No contributions yet"
                description="Complete a quest to be the first on the board."
              />
            ) : (
              <ol className="mt-3 flex flex-col gap-2">
                {leaderboard.map((row, i) => (
                  <motion.li
                    key={row.user_id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-2.5"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-muted-foreground">#{i + 1}</span>
                      {row.display_name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {row.contribution_points} pts · {row.contribution_count} completions
                    </span>
                  </motion.li>
                ))}
              </ol>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="font-semibold">Members ({members.filter((m) => !m.left_at).length})</h2>
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {members
                .filter((m) => !m.left_at)
                .map((m) => (
                  <li key={m.user_id} className="flex items-center gap-2 text-sm">
                    {m.role === "owner" && <Crown className="h-4 w-4 text-tier-gold" aria-hidden />}
                    {m.display_name}
                  </li>
                ))}
            </ul>
          </Card>

          <div className="flex flex-wrap gap-2">
            {myRole !== "owner" && (
              <Button variant="outline" size="sm" disabled={pending} onClick={handleLeave}>
                <LogOut className="h-4 w-4" aria-hidden />
                Leave challenge
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setShowReport((v) => !v)}>
              <Flag className="h-4 w-4" aria-hidden />
              Report
            </Button>
          </div>

          {showReport && <ReportForm challengeId={challenge.id} onDone={() => setShowReport(false)} />}

          {isAdmin && (
            <Card className="flex flex-col gap-2 p-5">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" aria-hidden />
                <h2 className="font-semibold">Admin</h2>
              </div>
              <div className="flex gap-2">
                {challenge.status === "disabled" ? (
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => handleAdminStatus("active")}>
                    Re-enable
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => handleAdminStatus("disabled")}>
                    Disable for everyone
                  </Button>
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function ReportForm({ challengeId, onDone }: { challengeId: string; onDone: () => void }) {
  const [comments, setComments] = useState("");
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await reportChallenge({ challengeId, comments });
      if (result.ok) {
        setStatus("sent");
        setTimeout(onDone, 1200);
      }
    });
  }

  if (status === "sent") {
    return (
      <Card className="p-4 text-sm text-success">Thanks — the team will take a look.</Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        What&apos;s the issue?
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          maxLength={500}
          rows={3}
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <div className="flex gap-2">
        <Button size="sm" disabled={pending || comments.trim().length < 5} onClick={handleSubmit}>
          Send report
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
