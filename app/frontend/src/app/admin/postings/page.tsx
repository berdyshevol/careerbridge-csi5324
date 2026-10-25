import ApprovalQueue from "@/components/ApprovalQueue";
import { serverSession } from "@/lib/serverSession";

// The session is read on the server, as the header reads it, so the page never renders without it
export default async function AdminPostingsPage() {
  return <ApprovalQueue session={await serverSession()} />;
}
