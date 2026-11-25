import { notFound } from "next/navigation";
import AccessNotice from "@/components/AccessNotice";
import PostingEditForm from "@/components/PostingEditForm";
import { editPostingPath } from "@/components/PostingFields";
import { serverSession } from "@/lib/serverSession";

export default async function EditPostingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postingId = Number(id);
  if (!Number.isSafeInteger(postingId) || postingId < 1) {
    notFound();
  }

  const session = await serverSession();
  if (session?.user.role === "RECRUITER") {
    return <PostingEditForm token={session.token} postingId={postingId} />;
  }
  return session ? (
    <AccessNotice title="Recruiters only" user={session.user}>
      Only the recruiter who created a posting changes it.
    </AccessNotice>
  ) : (
    <AccessNotice title="Recruiters only" logInTo={editPostingPath(postingId)}>
      Log in as a recruiter to change your posting.
    </AccessNotice>
  );
}
