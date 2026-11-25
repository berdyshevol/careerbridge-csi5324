import AccessNotice from "@/components/AccessNotice";
import BackendDown from "@/components/BackendDown";
import PageTitle from "@/components/PageTitle";
import RecruiterOrganizations from "@/components/RecruiterOrganizations";
import { SessionEnded, viewMemberships, type Membership } from "@/lib/api";
import { serverSession } from "@/lib/serverSession";

const HERE = "/recruiter/organizations";

// UC-09 Join Additional Organization
export default async function RecruiterOrganizationsPage() {
  const session = await serverSession();
  if (!session) {
    return (
      <AccessNotice title="Recruiters only" logInTo={HERE}>
        Log in as a recruiter to see your organizations.
      </AccessNotice>
    );
  }
  if (session.user.role !== "RECRUITER") {
    return (
      <AccessNotice title="Recruiters only" user={session.user}>
        Only a recruiter belongs to organizations.
      </AccessNotice>
    );
  }

  let memberships: Membership[];
  try {
    memberships = await viewMemberships(session.token);
  } catch (err) {
    if (err instanceof SessionEnded) {
      return (
        <AccessNotice title="Your session has ended" logInTo={HERE} ended>
          Log in again to see your organizations.
        </AccessNotice>
      );
    }
    return <BackendDown />;
  }
  return (
    <div className="flex flex-col gap-5">
      <PageTitle subtitle="You recruit for one organization at a time.">Organizations</PageTitle>
      <RecruiterOrganizations token={session.token} initial={memberships} />
    </div>
  );
}
