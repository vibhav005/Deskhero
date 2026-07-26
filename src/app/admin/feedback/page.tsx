import { listFeedbackAdmin } from "@/lib/queries/admin";
import { FeedbackAdminClient } from "./feedback-admin-client";

export default async function AdminFeedbackPage() {
  const feedback = await listFeedbackAdmin();
  return <FeedbackAdminClient feedback={feedback} />;
}
