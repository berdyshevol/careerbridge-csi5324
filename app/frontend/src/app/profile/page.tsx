import AccessNotice from "@/components/AccessNotice";
import ProfilePreview from "@/components/ProfilePreview";
import { serverSession } from "@/lib/serverSession";

export default async function ProfilePage() {
  const session = await serverSession();
  if (session?.user.role === "APPLICANT") {
    return <ProfilePreview applicant={session.user} />;
  }
  return session ? (
    <AccessNotice title="Applicants only" user={session.user}>
      Only an applicant has a profile and a resume.
    </AccessNotice>
  ) : (
    <AccessNotice title="Log in to see your profile" logInTo="/profile" register>
      Your profile and resume belong to your applicant account.
    </AccessNotice>
  );
}
