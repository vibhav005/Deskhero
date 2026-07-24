import { getActivities } from "@/lib/queries/quest-library";
import { QuestLibraryClient } from "./quest-library-client";

export default async function QuestLibraryPage() {
  const activities = await getActivities();
  return <QuestLibraryClient activities={activities} />;
}
