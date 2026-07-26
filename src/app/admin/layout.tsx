import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/activities", label: "Activities" },
  { href: "/admin/xp", label: "XP adjustments" },
  { href: "/admin/feedback", label: "Feedback" },
];

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
    <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-6 px-4 py-8 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold tracking-tight">DeskHero Admin</h1>
        <nav className="flex flex-wrap gap-1.5">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Exit
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
