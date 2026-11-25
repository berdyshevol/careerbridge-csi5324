import AccessNotice from "@/components/AccessNotice";
import RecruiterPostingList from "@/components/RecruiterPostingList";
import { serverSession } from "@/lib/serverSession";

export default async function RecruiterPostingsPage() {
  const session = await serverSession();
  if (session?.user.role === "RECRUITER") {
    return <RecruiterPostingList token={session.token} />;
  }
  return session ? (
    <AccessNotice title="Recruiters only" user={session.user}>
      Only a recruiter sees the postings of an organization.
    </AccessNotice>
  ) : (
    <AccessNotice title="Recruiters only" logInTo="/recruiter/postings">
      Log in as a recruiter to see the postings of your organization.
    </AccessNotice>
  );
}
