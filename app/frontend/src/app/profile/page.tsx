import AccessNotice from "@/components/AccessNotice";
import BackendDown from "@/components/BackendDown";
import ProfilePreview from "@/components/ProfilePreview";
import { SessionEnded, viewProfile, type Profile } from "@/lib/api";
import { serverSession } from "@/lib/serverSession";

export default async function ProfilePage() {
  const session = await serverSession();
  if (!session) {
    return (
      <AccessNotice title="Log in to see your profile" logInTo="/profile" register>
        Your profile and resume belong to your applicant account.
      </AccessNotice>
    );
  }
  if (session.user.role !== "APPLICANT") {
    return (
      <AccessNotice title="Applicants only" user={session.user}>
        Only an applicant has a profile and a resume.
      </AccessNotice>
    );
  }

  let profile: Profile;
  try {
    profile = await viewProfile(session.token);
  } catch (err) {
    if (err instanceof SessionEnded) {
      return (
        <AccessNotice title="Your session has ended" logInTo="/profile" ended>
          Log in again to see your profile.
        </AccessNotice>
      );
    }
    return <BackendDown />;
  }
  return <ProfilePreview profile={profile} />;
}
