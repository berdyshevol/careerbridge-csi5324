import { notFound } from "next/navigation";
import AccessNotice from "@/components/AccessNotice";
import RecruiterPostingApplicants from "@/components/RecruiterPostingApplicants";
import { serverSession } from "@/lib/serverSession";

export default async function RecruiterPostingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postingId = Number(id);
  if (!Number.isSafeInteger(postingId) || postingId < 1) {
    notFound();
  }

  const session = await serverSession();
  if (session?.user.role === "RECRUITER") {
    return <RecruiterPostingApplicants token={session.token} postingId={postingId} />;
  }
  return session ? (
    <AccessNotice title="Recruiters only" user={session.user}>
      Only a recruiter sees the applicants of a posting.
    </AccessNotice>
  ) : (
    <AccessNotice title="Recruiters only" logInTo={`/recruiter/postings/${postingId}`}>
      Log in as a recruiter to see the applicants of a posting.
    </AccessNotice>
  );
}
