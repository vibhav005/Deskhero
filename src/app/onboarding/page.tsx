import { redirect } from "next/navigation";
import { getOnboardingProgress } from "@/lib/queries/onboarding";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const progress = await getOnboardingProgress();

  if (!progress) redirect("/auth/login");
  if (progress.onboardingCompletedAt) redirect("/dashboard");

  return <OnboardingWizard initial={progress} />;
}
