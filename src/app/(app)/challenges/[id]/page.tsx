import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { getChallengeDetail } from "@/lib/queries/challenges";
import { createClient } from "@/lib/supabase/server";
import { ChallengeDetailClient } from "./challenge-detail-client";

export default async function ChallengeDetailPage({ params }: { params: { id: string } }) {
  const detail = await getChallengeDetail(params.id);
  if (!detail) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg font-semibold">Challenge not found</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          It may be invite-only and you&apos;re not a member, or it doesn&apos;t exist.
        </p>
        <Link href="/challenges" className={buttonVariants({ variant: "outline" })}>
          Back to challenges
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    isAdmin = profile?.role === "admin";
  }

  return <ChallengeDetailClient detail={detail} isAdmin={isAdmin} />;
}
