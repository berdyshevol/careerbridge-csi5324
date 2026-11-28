import { notFound } from "next/navigation";
import AccessNotice from "@/components/AccessNotice";
import RecruiterApplicationReview from "@/components/RecruiterApplicationReview";
import { serverSession } from "@/lib/serverSession";

export default async function RecruiterApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isSafeInteger(applicationId) || applicationId < 1) {
    notFound();
  }

  const session = await serverSession();
  if (session?.user.role === "RECRUITER") {
    return <RecruiterApplicationReview token={session.token} applicationId={applicationId} />;
  }
  return session ? (
    <AccessNotice title="Recruiters only" user={session.user}>
      Only a recruiter reviews an application.
    </AccessNotice>
  ) : (
    <AccessNotice title="Recruiters only" logInTo={`/recruiter/applications/${applicationId}`}>
      Log in as a recruiter to review an application.
    </AccessNotice>
  );
}
