import AccessNotice from "@/components/AccessNotice";
import ApprovalQueue from "@/components/ApprovalQueue";
import { serverSession } from "@/lib/serverSession";

const HERE = "/admin/postings";

// The session is read on the server, as the header reads it, so the page never renders without it.
// Another role gets only the notice, without the administrator's page heading (ui-drafts, principle 5)
export default async function AdminPostingsPage() {
  const session = await serverSession();
  if (!session) {
    return (
      <AccessNotice title="Administrators only" logInTo={HERE}>
        Log in as an administrator to review submitted postings.
      </AccessNotice>
    );
  }
  if (session.user.role !== "ADMINISTRATOR") {
    return (
      <AccessNotice title="Administrators only" user={session.user}>
        Only an administrator reviews postings.
      </AccessNotice>
    );
  }
  return <ApprovalQueue session={session} />;
}
