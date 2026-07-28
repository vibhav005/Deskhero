import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/app/page-header";
import { AdminNav } from "./admin-nav";

/**
 * Server Component gate: redirects anyone who isn't profiles.role='admin'.
 * Defense in depth — every admin mutation is also gated at the RLS/RPC layer
 * regardless of what this layout does, so this exists purely for UX (no
 * flash of admin UI, no client-side bypass via disabling JS).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-6 px-4 py-8 md:px-8"
    >
      <PageHeader title="Admin" description="Catalog, XP, and feedback management." action={<AdminNav />} />
      {children}
    </main>
  );
}
