import "server-only";

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailAdapter {
  send(message: EmailMessage): Promise<{ ok: boolean; error?: string }>;
}

/**
 * Dev fallback — logs instead of sending. The only implementation wired up
 * for now, per the confirmed Phase 2 scope: non-critical product email stays
 * behind this swappable interface until a real provider is configured
 * (Supabase's own auth email handles account-related messages separately).
 */
class ConsoleEmailAdapter implements EmailAdapter {
  async send(message: EmailMessage) {
    console.log("[email:console]", JSON.stringify(message));
    return { ok: true };
  }
}

/** Swap in a real provider later by adding a case here — nothing else needs to change. */
export function getEmailAdapter(): EmailAdapter {
  const kind = process.env.EMAIL_ADAPTER ?? "console";
  switch (kind) {
    case "console":
    default:
      return new ConsoleEmailAdapter();
  }
}
