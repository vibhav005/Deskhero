import { getBreakActivities } from "@/lib/queries/workmode";
import { WorkModeClient } from "./work-mode-client";

export default async function WorkModePage() {
  const breakActivities = await getBreakActivities();
  return <WorkModeClient breakActivities={breakActivities} />;
}
