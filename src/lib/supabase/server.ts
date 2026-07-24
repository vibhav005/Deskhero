import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Cookie-scoped server Supabase client — for Server Components, Server Actions,
 * and Route Handlers. Carries the user's own JWT, so RLS enforces authorization
 * even if application code forgets a `WHERE user_id = ...` clause.
 *
 * Server Components can only read cookies, not set them (token refresh writes
 * happen in middleware) — the try/catch below absorbs that expected no-op.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — middleware already refreshes
            // the session, so this is a safe no-op.
          }
        },
      },
    },
  );
}
