import AccessNotice from "@/components/AccessNotice";
import BackendDown from "@/components/BackendDown";
import PageTitle from "@/components/PageTitle";
import RecruiterRequestQueue from "@/components/RecruiterRequestQueue";
import { openRecruiterRequestQueue, SessionEnded, type RecruiterRequestEntry } from "@/lib/api";
import { serverSession } from "@/lib/serverSession";

const HERE = "/admin/requests";

// UC-10 steps 1-2. FR-UC10.1: only the Administrator opens the queue; the backend checks it too.
export default async function AdminRequestsPage() {
  const session = await serverSession();
  if (!session) {
    return (
      <AccessNotice title="Administrators only" logInTo={HERE}>
        Log in as an administrator to review recruiter requests.
      </AccessNotice>
    );
  }
  if (session.user.role !== "ADMINISTRATOR") {
    return (
      <AccessNotice title="Administrators only" user={session.user}>
        Only an administrator reviews recruiter requests.
      </AccessNotice>
    );
  }
  let requests: RecruiterRequestEntry[];
  try {
    requests = await openRecruiterRequestQueue(session.token);
  } catch (err) {
    if (err instanceof SessionEnded) {
      return (
        <AccessNotice title="Your session has ended" logInTo={HERE} ended>
          Log in again to review recruiter requests.
        </AccessNotice>
      );
    }
    return <BackendDown />;
  }
  return (
    <div className="flex flex-col gap-5">
      <PageTitle subtitle="Oldest first.">Recruiter requests</PageTitle>
      <RecruiterRequestQueue requests={requests} />
    </div>
  );
}
