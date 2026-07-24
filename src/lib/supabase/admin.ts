import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role client — bypasses RLS entirely. `server-only` makes any
 * accidental client-bundle import a build failure.
 *
 * Legitimate call sites only: admin aggregate dashboard queries (behind an
 * explicit is_admin() check) and auth.admin.deleteUser() for account
 * deletion. Every other privileged operation (XP, achievements, streaks) goes
 * through SECURITY DEFINER Postgres functions instead — never this client.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      // See server.ts — avoids Next's fetch memoization serving stale reads.
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    },
  );
}
