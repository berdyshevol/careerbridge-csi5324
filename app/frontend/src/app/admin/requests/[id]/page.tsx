import { notFound } from "next/navigation";
import AccessNotice from "@/components/AccessNotice";
import BackendDown from "@/components/BackendDown";
import RecruiterRequestReview from "@/components/RecruiterRequestReview";
import { selectRecruiterRequest, SessionEnded, type RecruiterRequestDetails } from "@/lib/api";
import { serverSession } from "@/lib/serverSession";

// UC-10 steps 3-8
export default async function AdminRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const here = `/admin/requests/${id}`;
  const session = await serverSession();
  if (!session) {
    return (
      <AccessNotice title="Administrators only" logInTo={here}>
        Log in as an administrator to review this request.
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
  let request: RecruiterRequestDetails | null;
  try {
    request = await selectRecruiterRequest(session.token, id);
  } catch (err) {
    if (err instanceof SessionEnded) {
      return (
        <AccessNotice title="Your session has ended" logInTo={here} ended>
          Log in again to review this request.
        </AccessNotice>
      );
    }
    return <BackendDown />;
  }
  if (!request) {
    notFound();
  }
  return <RecruiterRequestReview token={session.token} request={request} />;
}
