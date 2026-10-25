import AccessNotice from "@/components/AccessNotice";
import PostingForm from "@/components/PostingForm";
import { serverSession } from "@/lib/serverSession";

export default async function NewPostingPage() {
  const session = await serverSession();
  if (session?.user.role === "RECRUITER") {
    return <PostingForm token={session.token} />;
  }
  return session ? (
    <AccessNotice title="Recruiters only" user={session.user}>
      Only a recruiter creates job postings.
    </AccessNotice>
  ) : (
    <AccessNotice title="Recruiters only" logInTo="/recruiter/postings/new">
      Log in as a recruiter to create a job posting.
    </AccessNotice>
  );
}
