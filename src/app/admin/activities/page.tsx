import { listActivitiesAdmin } from "@/lib/queries/admin";
import { ActivitiesAdminClient } from "./activities-admin-client";

export default async function AdminActivitiesPage() {
  const activities = await listActivitiesAdmin();
  return <ActivitiesAdminClient activities={activities} />;
}
