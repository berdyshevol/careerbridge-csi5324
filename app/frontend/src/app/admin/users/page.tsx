import AccessNotice from "@/components/AccessNotice";
import PageTitle from "@/components/PageTitle";
import UserList from "@/components/UserList";
import { SessionEnded, viewUsers, type UserDirectory } from "@/lib/api";
import { serverSession } from "@/lib/serverSession";

const HERE = "/admin/users";

export default async function AdminUsersPage() {
  const session = await serverSession();
  if (!session) {
    return (
      <AccessNotice title="Administrators only" logInTo={HERE}>
        Log in as the administrator to see the users.
      </AccessNotice>
    );
  }
  if (session.user.role !== "ADMINISTRATOR") {
    return (
      <AccessNotice title="Administrators only" user={session.user}>
        Only an administrator sees the list of users.
      </AccessNotice>
    );
  }

  let directory: UserDirectory | null = null;
  try {
    directory = await viewUsers(session.token);
  } catch (err) {
    if (err instanceof SessionEnded) {
      return (
        <AccessNotice title="Your session has ended" logInTo={HERE} ended>
          Log in again to see the users.
        </AccessNotice>
      );
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageTitle subtitle="Everyone with an account, and the role it has.">Users</PageTitle>
      {directory ? (
        <UserList directory={directory} />
      ) : (
        <div role="alert" className="alert alert-error">
          <span>The users could not be loaded. Try again in a moment.</span>
        </div>
      )}
    </div>
  );
}
